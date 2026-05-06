// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

uint256 constant DEFAULT_GLOBAL_MIN_BET = 100 wei;                 // 10^-16 ETH
uint256 constant DEFAULT_GLOBAL_MAX_BET = 1000000000000000000 wei; //      1 ETH
uint256 constant DEFAULT_HOUSE_FEE_PERCENTAGE = 5;
uint256 constant DEFAULT_MIN_MULTIPLIER = 1000;
uint256 constant DEFAULT_MAX_MULTIPLIER = 3000;

contract Config {
    uint256 public globalMinBet;            // in wei
    uint256 public globalMaxBet;            // in wei
    uint256 public houseFeePercentage;      // raw percentage, e.g. 5 means 5%. House fee = pot * houseFeePercentage / 100
    uint8[] public validGridSizes;          // [6, 7, 8, 9, 10, 11]
    uint8[] public validColourCounts;       // [3, 4, 5, 6, 7]
    uint256[] public validBettingDurations; // [300, 600, 1800, 3600]
    uint256 public minMultiplier;           // scaled by 1000, e.g. 1000 means 1x
    uint256 public maxMultiplier;           // scaled by 1000, e.g. 3000 means 3x
    address public owner;                   // address of the person that deployed the contract

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() {
        globalMinBet = DEFAULT_GLOBAL_MIN_BET;
        globalMaxBet = DEFAULT_GLOBAL_MAX_BET;
        houseFeePercentage = DEFAULT_HOUSE_FEE_PERCENTAGE;

        validGridSizes = [6, 7, 8, 9, 10, 11];
        validColourCounts = [3, 4, 5, 6, 7];
        validBettingDurations = [300, 600, 1800, 3600];

        maxMultiplier = DEFAULT_MAX_MULTIPLIER;
        minMultiplier = DEFAULT_MIN_MULTIPLIER;
        owner = msg.sender;
    }

    function setGlobalLimits(uint256 minBet, uint256 maxBet) external onlyOwner {
        globalMinBet = minBet;
        globalMaxBet = maxBet;
    }

    function setHouseFeePercentage(uint256 feePercentage) external onlyOwner {
        houseFeePercentage = feePercentage;
    }

    function setValidGridSizes(uint8[] calldata sizes) external onlyOwner {
        validGridSizes = sizes;
    }

    function setValidBettingDurations(uint256[] calldata durations) external onlyOwner {
        validBettingDurations = durations;
    }

    function setMultiplierRange(uint256 min, uint256 max) external onlyOwner {
        minMultiplier = min;
        maxMultiplier = max;
    }

    function isValidGridSize(uint8 size) external view returns (bool) {
        for (uint8 i = 0; i < validGridSizes.length; i++) {
            if (validGridSizes[i] == size) {
                return true;
            }
        }
        return false;
    }

    function isValidColourCount(uint8 count) external view returns (bool) {
        for (uint8 i = 0; i < validColourCounts.length; i++) {
            if (validColourCounts[i] == count) {
                return true;
            }
        }
        return false;
    }
}
