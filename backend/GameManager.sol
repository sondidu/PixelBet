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
}
