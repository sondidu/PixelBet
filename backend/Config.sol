// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

uint256 constant DEFAULT_GLOBAL_MIN_BET = 100 wei;                 // 10^-16 ETH
uint256 constant DEFAULT_GLOBAL_MAX_BET = 1000000000000000000 wei; //      1 ETH
uint256 constant DEFAULT_HOUSE_FEE_PERCENTAGE = 5;
uint256 constant DEFAULT_MIN_MULTIPLIER = 1000;
uint256 constant DEFAULT_MAX_MULTIPLIER = 3000;

uint8 constant MAX_GRID_SIZES_LENGTH = 10;
uint8 constant MAX_VALID_COLOUR_COUNTS_LENGTH = 10;
uint8 constant MAX_BETTING_DURATIONS_LENGTH = 10;

interface IConfig {
    function isValidGridSize(uint8 size) external view returns (bool);
    function isValidColourCount(uint8 count) external view returns (bool);
    function isValidBettingDuration(uint256 duration) external view returns (bool);
    function globalMinBet() external view returns (uint256);
    function globalMaxBet() external view returns (uint256);
    function houseFeePercentage() external view returns (uint256);
    function maxMultiplier() external view returns (uint256);
    function minMultiplier() external view returns (uint256);
}

contract Config is IConfig {
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
        require(msg.sender == owner, "Only the owner is allowed to do this operation!");
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
        require(minBet != 0, "Minimum bet can't be 0!");
        require(maxBet != 0, "Maximum bet can't be 0!");
        require(minBet < maxBet, "Minimum bet must be less than Maximum bet!");

        globalMinBet = minBet;
        globalMaxBet = maxBet;
    }

    function setHouseFeePercentage(uint256 feePercentage) external onlyOwner {
        require(feePercentage != 0, "Fee percentage can't be 0!");
        require(feePercentage <= 100, "Fee percentage must be less than 100!");

        houseFeePercentage = feePercentage;
    }

    function setValidGridSizes(uint8[] calldata sizes) external onlyOwner {
        require(sizes.length <= MAX_GRID_SIZES_LENGTH, "Too many grid sizes!");
        for (uint8 i = 0; i < sizes.length; i++) {
            for (uint8 j = i + 1; j < sizes.length; j++) {
                require(sizes[i] != sizes[j], "Valid grid sizes must be unique!");
            }
        }

        validGridSizes = sizes;
    }

    function setValidColours(uint8[] calldata colours) external onlyOwner {
        require(colours.length <= MAX_VALID_COLOUR_COUNTS_LENGTH, "Too many colour counts!");
        for (uint8 i = 0; i < colours.length; i++) {
            for (uint8 j = i + 1; j < colours.length; j++) {
                require(colours[i] != colours[j], "Valid colour counts must be unique!");
            }
        }

        validColourCounts = colours;
    }

    function setValidBettingDurations(uint256[] calldata durations) external onlyOwner {
        require(durations.length <= MAX_BETTING_DURATIONS_LENGTH, "Too many durations!");

        for (uint8 i = 0; i < durations.length; i++) {
            for (uint8 j = i + 1; j < durations.length; j++) {
                require(durations[i] != durations[j], "Valid grid durations must be unique!");
            }
        }

        validBettingDurations = durations;
    }

    function setMultiplierRange(uint256 min, uint256 max) external onlyOwner {
        require(min >= 1000, "Minimum multiplier (scaled by 1000) must be above 1000 (1000 = 1x)");
        require(min < max, "Minimum multiplier must be less than Maximum multiplier!");

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

    function isValidBettingDuration(uint256 duration) external view returns (bool) {
        for (uint8 i = 0; i < validBettingDurations.length; i++) {
            if (validBettingDurations[i] == duration) {
                return true;
            }
        }
        return false;
    }
}
