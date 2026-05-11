// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import "./Config.sol";
import "./GameManager.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface used by Betting to call GameManager — matches GameManager.sol exactly.
interface IGameManager {
    function getRound(uint256 bettingId) external view returns (Round memory);
}

contract Betting is ReentrancyGuard {

    // ── Structs ───────────────────────────────────────────────────────────────

    struct Bet {
        address player;
        uint8 chosenColour;
        uint256 amount;      // in wei
        uint256 timestamp;   // block.timestamp when bet was placed
        uint256 multiplier;  // scaled by 1000, e.g. 2500 = 2.5x
        bool claimed;
    }

    // ── State ─────────────────────────────────────────────────────────────────

    IGameManager public immutable gameManager;
    IConfig public immutable config;

    /// @dev bettingId → all bets placed in that betting
    mapping(uint256 => Bet[]) public bets;

    /// @dev bettingId → player address → indices into bets[bettingId]
    mapping(uint256 => mapping(address => uint256[])) public playerBetIndices;

    /// @dev bettingId → total ETH wagered (wei)
    mapping(uint256 => uint256) public totalPot;

    /// @dev bettingId → whether the house has already withdrawn its fee
    mapping(uint256 => bool) public houseFeeWithdrawn;

    // ── Events ────────────────────────────────────────────────────────────────

    event BetPlaced(
        uint256 indexed bettingId,
        address indexed player,
        uint8 chosenColour,
        uint256 amount,
        uint256 multiplier
    );

    event WinningsClaimed(
        uint256 indexed bettingId,
        address indexed player,
        uint256 payout
    );

    event RefundClaimed(
        uint256 indexed bettingId,
        address indexed player,
        uint256 refund
    );

    event HouseFeeWithdrawn(
        uint256 indexed bettingId,
        address indexed house,
        uint256 fee
    );

    // ── Errors ────────────────────────────────────────────────────────────────

    error BettingNotOpen();
    error BettingWindowExpired();
    error BetBelowMinimum(uint256 sent, uint256 minimum);
    error BetAboveMaximum(uint256 sent, uint256 maximum);
    error InvalidColour(uint8 colour, uint8 numColours);
    error HouseCannotBet();
    error BettingNotResolved();
    error BettingNotCancelled();
    error NoBetsToProcess();
    error NotBettingHouse();
    error FeeAlreadyWithdrawn();
    error TransferFailed();

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _gameManager, address _config) {
        gameManager = IGameManager(_gameManager);
        config = IConfig(_config);
    }

    // ── External: Place Bet ───────────────────────────────────────────────────

    /// @notice Place a bet on a colour. Calls through GameManager to confirm
    ///         the betting is OPEN and the window has not expired.
    /// @param bettingId  ID of the betting (round) from GameManager.
    /// @param colour     Zero-based colour index (must be < round.numColours).
    function placeBet(uint256 bettingId, uint8 colour) external payable {
        Round memory round = gameManager.getRound(bettingId);

        // ── Checks ────────────────────────────────────────────────────────────
        if (round.state != RoundState.OPEN) revert BettingNotOpen();
        if (block.timestamp >= round.bettingWindowEnd) revert BettingWindowExpired();
        if (msg.value < round.minBet) revert BetBelowMinimum(msg.value, round.minBet);
        if (msg.value > round.maxBet) revert BetAboveMaximum(msg.value, round.maxBet);
        if (colour >= round.numColours) revert InvalidColour(colour, round.numColours);
        if (msg.sender == round.house) revert HouseCannotBet();

        // ── Effects ───────────────────────────────────────────────────────────
        uint256 multiplier = _calculateMultiplier(round);

        uint256 betIndex = bets[bettingId].length;
        bets[bettingId].push(Bet({
            player: msg.sender,
            chosenColour: colour,
            amount: msg.value,
            timestamp: block.timestamp,
            multiplier: multiplier,
            claimed: false
        }));

        playerBetIndices[bettingId][msg.sender].push(betIndex);
        totalPot[bettingId] += msg.value;

        // ETH is implicitly held in this contract via msg.value — no transfer call needed.
        emit BetPlaced(bettingId, msg.sender, colour, msg.value, multiplier);
    }

    // ── External: Claim Winnings ──────────────────────────────────────────────

    /// @notice Winning players call this after the betting resolves to collect
    ///         their payout. Payout is scaled proportionally if multipliers
    ///         would exceed the distributable pot.
    /// @param bettingId ID of the resolved betting.
    function claimWinnings(uint256 bettingId) external nonReentrant {
        Round memory round = gameManager.getRound(bettingId);

        // ── Checks ────────────────────────────────────────────────────────────
        if (round.state != RoundState.RESOLVED) revert BettingNotResolved();

        uint256[] storage indices = playerBetIndices[bettingId][msg.sender];
        if (indices.length == 0) revert NoBetsToProcess();

        uint256 houseFee = (totalPot[bettingId] * config.houseFeePercentage()) / 100;
        uint256 distributablePot = totalPot[bettingId] - houseFee;

        uint256 rawPayout = _calcRawPayout(bettingId, round.winningColour, indices);
        if (rawPayout == 0) revert NoBetsToProcess();

        uint256 totalRawPayout = _calcTotalRawPayout(bettingId, round.winningColour);

        uint256 payout;
        if (totalRawPayout > distributablePot) {
            // Scale down so total payouts never exceed the distributable pot
            payout = (rawPayout * distributablePot) / totalRawPayout;
        } else {
            payout = rawPayout;
        }

        // ── Effects — mark BEFORE transferring (checks-effects-interactions) ──
        for (uint256 i = 0; i < indices.length; i++) {
            Bet storage bet = bets[bettingId][indices[i]];
            if (!bet.claimed && bet.chosenColour == round.winningColour) {
                bet.claimed = true;
            }
        }

        // ── Interactions ──────────────────────────────────────────────────────
        (bool ok, ) = msg.sender.call{value: payout}("");
        if (!ok) revert TransferFailed();

        emit WinningsClaimed(bettingId, msg.sender, payout);
    }

    // ── External: Claim Refund ────────────────────────────────────────────────

    /// @notice Players call this to recover their original wager if the house
    ///         cancels the betting before resolution.
    /// @param bettingId ID of the cancelled betting.
    function claimRefund(uint256 bettingId) external nonReentrant {
        Round memory round = gameManager.getRound(bettingId);

        // ── Checks ────────────────────────────────────────────────────────────
        if (round.state != RoundState.CANCELLED) revert BettingNotCancelled();

        uint256[] storage indices = playerBetIndices[bettingId][msg.sender];
        if (indices.length == 0) revert NoBetsToProcess();

        // ── Effects ───────────────────────────────────────────────────────────
        uint256 refund = 0;
        for (uint256 i = 0; i < indices.length; i++) {
            Bet storage bet = bets[bettingId][indices[i]];
            if (!bet.claimed) {
                refund += bet.amount;
                bet.claimed = true;
            }
        }

        if (refund == 0) revert NoBetsToProcess();

        // ── Interactions ──────────────────────────────────────────────────────
        (bool ok, ) = msg.sender.call{value: refund}("");
        if (!ok) revert TransferFailed();

        emit RefundClaimed(bettingId, msg.sender, refund);
    }

    // ── External: Withdraw House Fee ──────────────────────────────────────────

    /// @notice House calls this once per resolved betting to collect the
    ///         platform fee percentage from the total pot.
    /// @param bettingId ID of the resolved betting.
    function withdrawHouseFee(uint256 bettingId) external nonReentrant {
        Round memory round = gameManager.getRound(bettingId);

        // ── Checks ────────────────────────────────────────────────────────────
        if (round.state != RoundState.RESOLVED) revert BettingNotResolved();
        if (msg.sender != round.house) revert NotBettingHouse();
        if (houseFeeWithdrawn[bettingId]) revert FeeAlreadyWithdrawn();

        // ── Effects ───────────────────────────────────────────────────────────
        uint256 fee = (totalPot[bettingId] * config.houseFeePercentage()) / 100;
        houseFeeWithdrawn[bettingId] = true;

        // ── Interactions ──────────────────────────────────────────────────────
        (bool ok, ) = msg.sender.call{value: fee}("");
        if (!ok) revert TransferFailed();

        emit HouseFeeWithdrawn(bettingId, msg.sender, fee);
    }

    // ── View ──────────────────────────────────────────────────────────────────

    /// @notice Returns all bets for a betting (public read).
    function getBets(uint256 bettingId) external view returns (Bet[] memory) {
        return bets[bettingId];
    }

    /// @notice Returns a player's bet indices within a betting.
    function getPlayerBetIndices(uint256 bettingId, address player)
        external
        view
        returns (uint256[] memory)
    {
        return playerBetIndices[bettingId][player];
    }

    // ── Internal: Multiplier ──────────────────────────────────────────────────

    /// @dev Linear decay from config.maxMultiplier at window open to
    ///      config.minMultiplier at window close (both scaled ×1000).
    function _calculateMultiplier(Round memory round) internal view returns (uint256) {
        uint256 maxMul = config.maxMultiplier();
        uint256 minMul = config.minMultiplier();

        uint256 windowDuration = round.bettingWindowEnd - round.bettingWindowStart;
        if (windowDuration == 0) return minMul;

        uint256 elapsed = block.timestamp - round.bettingWindowStart;
        if (elapsed >= windowDuration) return minMul;

        // Avoids floating point: multiply first, divide last.
        uint256 reduction = (elapsed * (maxMul - minMul)) / windowDuration;
        return maxMul - reduction;
    }

    // ── Internal: Payout Helpers ──────────────────────────────────────────────

    /// @dev Raw payout for the caller's unclaimed winning bets (before scaling).
    function _calcRawPayout(
        uint256 bettingId,
        uint8 winningColour,
        uint256[] storage indices
    ) internal view returns (uint256 raw) {
        for (uint256 i = 0; i < indices.length; i++) {
            Bet storage bet = bets[bettingId][indices[i]];
            if (!bet.claimed && bet.chosenColour == winningColour) {
                raw += (bet.amount * bet.multiplier) / 1000;
            }
        }
    }

    /// @dev Total raw payout across ALL bets on the winning colour.
    ///      Must be a round-wide invariant — do NOT filter by `claimed`, or the
    ///      scaling denominator shrinks across successive claims and later
    ///      winners get overpaid (and then stuck when the contract runs dry).
    function _calcTotalRawPayout(uint256 bettingId, uint8 winningColour)
        internal
        view
        returns (uint256 total)
    {
        Bet[] storage allBets = bets[bettingId];
        for (uint256 i = 0; i < allBets.length; i++) {
            Bet storage bet = allBets[i];
            if (bet.chosenColour == winningColour) {
                total += (bet.amount * bet.multiplier) / 1000;
            }
        }
    }
}
