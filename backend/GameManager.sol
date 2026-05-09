// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import "./Config.sol";

enum RoundState {
    OPEN,
    BETTING_CLOSED,
    RESOLVED,
    CANCELLED
}

struct Round {
    uint256 id;                 // unique round identifier
    address house;              // address of the house stakeholder
    uint8 gridSize;             // e.g., 6 for a 6×6 grid
    uint8 numColours;           // e.g., 5
    uint256 minBet;             // in wei
    uint256 maxBet;             // in wei
    bytes32 commitHash;         // keccak256(seed)
    bytes32 revealedSeed;       // populated on resolution
    uint8 winningColour;        // populated on resolution
    uint256 bettingWindowStart; // block.timestamp when round was created
    uint256 bettingWindowEnd;   // block.timestamp when betting closes
    RoundState state;           // round's state
}

contract GameManager {
    mapping (uint256 => Round) private rounds;
    uint256 public roundCounter;
    IConfig public configContract;

    modifier onlyHouse(uint256 roundId) {
        require(msg.sender == rounds[roundId].house, "Not the house!");
        _;
    }

    constructor(address configContractAddress) {
        roundCounter = 0;
        configContract = IConfig(configContractAddress);
    }

    function createRound(
        uint8 gridSize,
        uint8 numColours,
        uint256 minBet,
        uint256 maxBet,
        uint256 bettingDuration,
        bytes32 commitHash
    ) external returns (uint256) {
        // Validate against Config
        require(configContract.isValidGridSize(gridSize), "Invalid grid size!");
        require(configContract.isValidColourCount(numColours), "Invalid colour count!");
        require(configContract.isValidBettingDuration(bettingDuration), "Invalid duration!");
        require(minBet >= configContract.globalMinBet(), "Below global min bet!");
        require(maxBet <= configContract.globalMaxBet(), "Above global max bet!");
        require(minBet <= maxBet, "Min bet exceeds max bet!");
        require(commitHash != bytes32(0), "Empty commit hash!");

        uint256 roundId = roundCounter++;

        rounds[roundId] = Round({
            id: roundId,
            house: msg.sender,
            gridSize: gridSize,
            numColours: numColours,
            minBet: minBet,
            maxBet: maxBet,
            commitHash: commitHash,
            revealedSeed: bytes32(0),
            winningColour: 0,
            bettingWindowStart: block.timestamp,
            bettingWindowEnd: block.timestamp + bettingDuration,
            state: RoundState.OPEN
        });

        return roundId;
    }

    function resolveRound(uint256 roundId, bytes32 seed) external onlyHouse(roundId) {
        Round storage round = rounds[roundId];

        require(round.state == RoundState.OPEN || round.state == RoundState.BETTING_CLOSED, "Round not resolvable!");
        require(block.timestamp >= round.bettingWindowEnd, "Betting window still open!");
        require(keccak256(abi.encodePacked(seed)) == round.commitHash, "Seed does not match commit hash!");

        // Generate board and count colours
        uint256 totalCells = uint256(round.gridSize) * uint256(round.gridSize);
        uint256[] memory counts = new uint256[](round.numColours);

        for (uint256 i = 0; i < totalCells; i++) {
            bytes32 cellHash = keccak256(abi.encodePacked(seed, i));
            uint8 colourIndex = uint8(cellHash[0]) % round.numColours;
            counts[colourIndex]++;
        }

        // Find the dominant colour
        uint8 winningColour = 0;
        uint256 highestCount = counts[0];
        bool tied = false;
        for (uint8 numColour = 1; numColour < round.numColours; numColour++) {
            if (counts[numColour] > highestCount) {
                highestCount = counts[numColour];
                winningColour = numColour;
                tied = false;
            } else if (counts[numColour] == highestCount) {
                tied = true;
            }
        }

        // Tiebreaker if needed
        if (tied) {
            // Collect all colours that share the highest count
            uint8 tiedCount = 0;
            for (uint8 c = 0; c < round.numColours; c++) {
                if (counts[c] == highestCount) {
                    tiedCount++;
                }
            }

            uint8[] memory tiedColours = new uint8[](tiedCount);
            uint8 idx = 0;
            for (uint8 c = 0; c < round.numColours; c++) {
                if (counts[c] == highestCount) {
                    tiedColours[idx] = c;
                    idx++;
                }
            }

            // Already sorted ascending since we iterate 0..numColours
            bytes32 tieHash = keccak256(abi.encodePacked(seed, "tiebreaker"));
            uint8 winnerIndex = uint8(tieHash[0]) % tiedCount;
            winningColour = tiedColours[winnerIndex];
        }

        round.revealedSeed = seed;
        round.winningColour = winningColour;
        round.state = RoundState.RESOLVED;
    }

    function cancelRound(uint256 roundId) external onlyHouse(roundId) {
        Round storage round = rounds[roundId];
        require(round.state != RoundState.RESOLVED && round.state != RoundState.CANCELLED, "Round already resolved or cancelled!");
        round.state = RoundState.CANCELLED;
    }

    function getRound(uint256 roundId) external view returns(Round memory) {
        return rounds[roundId];
    }

    function getRounds(bool onlyOpen) external view returns (Round[] memory) {
        uint256 count = 0;

        // Get count because solidity needs to know the size
        for (uint256 i = 0; i < roundCounter; i++) {
            if (!onlyOpen || rounds[i].state == RoundState.OPEN) {
                count++;
            }
        }

        Round[] memory result = new Round[](count);
        uint256 idx = 0;

        for (uint256 i = 0; i < roundCounter; i++) {
            if (!onlyOpen || rounds[i].state == RoundState.OPEN) {
                result[idx++] = rounds[i];
            }
        }

        return result;
    }
}
