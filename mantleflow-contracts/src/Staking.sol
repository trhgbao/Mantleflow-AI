// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Staking
 * @notice Stake MFL de boost LTV cho MantleFlow
 * @dev Stake 1000 MFL → +2% LTV, 5000 MFL → +5% LTV, 10000 MFL → +10% LTV
 */
contract Staking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public mflToken;

    // LTV boost tiers
    uint256 public constant TIER1_AMOUNT = 1000 * 10 ** 18; // 1000 MFL
    uint256 public constant TIER2_AMOUNT = 5000 * 10 ** 18; // 5000 MFL
    uint256 public constant TIER3_AMOUNT = 10000 * 10 ** 18; // 10000 MFL

    uint256 public constant TIER1_BOOST = 200; // 2% = 200 BPS
    uint256 public constant TIER2_BOOST = 500; // 5% = 500 BPS
    uint256 public constant TIER3_BOOST = 1000; // 10% = 1000 BPS

    uint256 public constant MIN_STAKE_DURATION = 7 days;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 unlockTime;
    }

    // user => StakeInfo
    mapping(address => StakeInfo) public stakes;

    // Total staked
    uint256 public totalStaked;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);
    event StakeIncreased(address indexed user, uint256 additionalAmount, uint256 totalAmount);

    constructor(address _mflToken) {
        require(_mflToken != address(0), "Invalid token address");
        mflToken = IERC20(_mflToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Stake MFL tokens
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");

        StakeInfo storage userStake = stakes[msg.sender];

        // Transfer tokens to contract
        mflToken.safeTransferFrom(msg.sender, address(this), amount);

        if (userStake.amount == 0) {
            // New stake
            userStake.amount = amount;
            userStake.stakedAt = block.timestamp;
            userStake.unlockTime = block.timestamp + MIN_STAKE_DURATION;

            emit Staked(msg.sender, amount, userStake.unlockTime);
        } else {
            // Add to existing stake
            userStake.amount += amount;
            // Reset unlock time
            userStake.unlockTime = block.timestamp + MIN_STAKE_DURATION;

            emit StakeIncreased(msg.sender, amount, userStake.amount);
        }

        totalStaked += amount;
    }

    /**
     * @notice Unstake all tokens
     */
    function unstake() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.unlockTime, "Still locked");

        uint256 amount = userStake.amount;

        // Clear stake info
        delete stakes[msg.sender];
        totalStaked -= amount;

        // Transfer tokens back
        mflToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Unstake partial amount
     * @param amount Amount to unstake
     */
    function unstakePartial(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(block.timestamp >= userStake.unlockTime, "Still locked");

        userStake.amount -= amount;
        totalStaked -= amount;

        // If fully unstaked, clean up
        if (userStake.amount == 0) {
            delete stakes[msg.sender];
        }

        mflToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Get LTV boost for user based on staked amount
     * @param user User address
     * @return Boost in basis points (200 = 2%, 500 = 5%, 1000 = 10%)
     */
    function getLTVBoost(address user) external view returns (uint256) {
        uint256 stakedAmount = stakes[user].amount;

        if (stakedAmount >= TIER3_AMOUNT) {
            return TIER3_BOOST; // 10%
        } else if (stakedAmount >= TIER2_AMOUNT) {
            return TIER2_BOOST; // 5%
        } else if (stakedAmount >= TIER1_AMOUNT) {
            return TIER1_BOOST; // 2%
        }

        return 0;
    }

    /**
     * @notice Get current tier for user
     * @param user User address
     * @return tier (0 = none, 1 = 1000 MFL, 2 = 5000 MFL, 3 = 10000 MFL)
     */
    function getUserTier(address user) external view returns (uint256) {
        uint256 stakedAmount = stakes[user].amount;

        if (stakedAmount >= TIER3_AMOUNT) return 3;
        if (stakedAmount >= TIER2_AMOUNT) return 2;
        if (stakedAmount >= TIER1_AMOUNT) return 1;
        return 0;
    }

    /**
     * @notice Get stake info for user
     * @param user User address
     */
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }

    /**
     * @notice Check if user's stake is unlocked
     * @param user User address
     */
    function isUnlocked(address user) external view returns (bool) {
        StakeInfo memory userStake = stakes[user];
        return userStake.amount > 0 && block.timestamp >= userStake.unlockTime;
    }

    /**
     * @notice Get time until unlock
     * @param user User address
     */
    function getTimeUntilUnlock(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0 || block.timestamp >= userStake.unlockTime) {
            return 0;
        }
        return userStake.unlockTime - block.timestamp;
    }

    /**
     * @notice Get tier requirements
     */
    function getTierRequirements()
        external
        pure
        returns (
            uint256 tier1Amount,
            uint256 tier1Boost,
            uint256 tier2Amount,
            uint256 tier2Boost,
            uint256 tier3Amount,
            uint256 tier3Boost
        )
    {
        return (TIER1_AMOUNT, TIER1_BOOST, TIER2_AMOUNT, TIER2_BOOST, TIER3_AMOUNT, TIER3_BOOST);
    }
}
