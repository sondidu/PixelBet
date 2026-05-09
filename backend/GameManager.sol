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
}
