// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Liquidator
 * @notice Thanh ly NFT khi default - Dutch Auction + Insurance Fund
 * @dev Price starts at 80% face value, decreases over time
 */
contract Liquidator is IERC721Receiver, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    IERC721 public invoiceNFT;
    address public lendingPool;

    // Dutch Auction parameters
    uint256 public constant STARTING_PRICE_PERCENT = 80; // 80% of face value
    uint256 public constant ENDING_PRICE_PERCENT = 20; // 20% of face value
    uint256 public constant AUCTION_DURATION = 7 days;
    uint256 public constant PRICE_DECREASE_INTERVAL = 1 hours;

    enum AuctionStatus {
        Active,
        Sold,
        Cancelled,
        Settled
    }

    struct Auction {
        uint256 tokenId;
        uint256 loanId;
        address currency;
        uint256 faceValue; // Original invoice amount
        uint256 debtOwed; // Total debt owed to LPs
        uint256 startPrice; // Starting price (80% of face value)
        uint256 endPrice; // Minimum price (20% of face value)
        uint256 startTime;
        uint256 endTime;
        address seller; // Original borrower
        address buyer;
        uint256 soldPrice;
        AuctionStatus status;
    }

    // State
    uint256 private _nextAuctionId;
    mapping(uint256 => Auction) public auctions;

    // tokenId => auctionId
    mapping(uint256 => uint256) public tokenAuction;

    // Insurance fund per currency
    mapping(address => uint256) public insuranceFund;

    // Events
    event AuctionStarted(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        uint256 indexed loanId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 endTime
    );

    event AuctionBid(uint256 indexed auctionId, address indexed buyer, uint256 price);

    event AuctionSettled(
        uint256 indexed auctionId, address indexed buyer, uint256 finalPrice, uint256 lpRecovery, uint256 badDebtCovered
    );

    event AuctionCancelled(uint256 indexed auctionId, string reason);

    event InsuranceFundDeposit(address indexed currency, uint256 amount);
    event BadDebtCovered(address indexed currency, uint256 amount);

    constructor(address _invoiceNFT) {
        require(_invoiceNFT != address(0), "Invalid NFT address");
        invoiceNFT = IERC721(_invoiceNFT);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    // ============ Admin Functions ============

    function setLendingPool(address _lendingPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_lendingPool != address(0), "Invalid address");
        lendingPool = _lendingPool;
    }

    /**
     * @notice Add to insurance fund
     * @param currency Currency address
     * @param amount Amount to add
     */
    function addToInsurance(address currency, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");

        IERC20(currency).safeTransferFrom(msg.sender, address(this), amount);
        insuranceFund[currency] += amount;

        emit InsuranceFundDeposit(currency, amount);
    }

    // ============ Auction Functions ============

    /**
     * @notice Start Dutch auction for defaulted loan
     * @param tokenId NFT token ID
     * @param loanId Loan ID
     * @param currency Payment currency
     * @param faceValue Original invoice face value
     * @param debtOwed Total debt owed to LPs
     * @param seller Original borrower address
     */
    function startAuction(
        uint256 tokenId,
        uint256 loanId,
        address currency,
        uint256 faceValue,
        uint256 debtOwed,
        address seller
    ) external onlyRole(KEEPER_ROLE) nonReentrant returns (uint256) {
        require(invoiceNFT.ownerOf(tokenId) == address(this), "NFT not in liquidator");
        require(
            tokenAuction[tokenId] == 0 || auctions[tokenAuction[tokenId]].status != AuctionStatus.Active,
            "Auction exists"
        );
        require(faceValue > 0, "Invalid face value");

        uint256 auctionId = ++_nextAuctionId;
        uint256 startPrice = (faceValue * STARTING_PRICE_PERCENT) / 100;
        uint256 endPrice = (faceValue * ENDING_PRICE_PERCENT) / 100;

        auctions[auctionId] = Auction({
            tokenId: tokenId,
            loanId: loanId,
            currency: currency,
            faceValue: faceValue,
            debtOwed: debtOwed,
            startPrice: startPrice,
            endPrice: endPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + AUCTION_DURATION,
            seller: seller,
            buyer: address(0),
            soldPrice: 0,
            status: AuctionStatus.Active
        });

        tokenAuction[tokenId] = auctionId;

        emit AuctionStarted(auctionId, tokenId, loanId, startPrice, endPrice, block.timestamp + AUCTION_DURATION);

        return auctionId;
    }

    /**
     * @notice Get current auction price (Dutch auction - decreases over time)
     * @param auctionId Auction ID
     */
    function getCurrentPrice(uint256 auctionId) public view returns (uint256) {
        Auction memory auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");

        if (block.timestamp >= auction.endTime) {
            return auction.endPrice;
        }

        uint256 elapsed = block.timestamp - auction.startTime;
        uint256 duration = auction.endTime - auction.startTime;
        uint256 priceDrop = auction.startPrice - auction.endPrice;

        // Linear price decrease
        uint256 currentDrop = (priceDrop * elapsed) / duration;
        return auction.startPrice - currentDrop;
    }

    /**
     * @notice Bid on auction (buy NFT at current price)
     * @param auctionId Auction ID
     */
    function bid(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp <= auction.endTime, "Auction ended");

        uint256 price = getCurrentPrice(auctionId);

        // Transfer payment from buyer
        IERC20(auction.currency).safeTransferFrom(msg.sender, address(this), price);

        auction.buyer = msg.sender;
        auction.soldPrice = price;
        auction.status = AuctionStatus.Sold;

        emit AuctionBid(auctionId, msg.sender, price);
    }

    /**
     * @notice Settle auction - transfer NFT to buyer, handle LP recovery
     * @param auctionId Auction ID
     */
    function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Sold, "Auction not sold");

        auction.status = AuctionStatus.Settled;

        // Transfer NFT to buyer
        invoiceNFT.safeTransferFrom(address(this), auction.buyer, auction.tokenId);

        // Calculate LP recovery vs bad debt
        uint256 lpRecovery;
        uint256 badDebtCovered = 0;

        if (auction.soldPrice >= auction.debtOwed) {
            // Full recovery + surplus
            lpRecovery = auction.debtOwed;
            uint256 surplus = auction.soldPrice - auction.debtOwed;
            // Surplus goes to original seller
            if (surplus > 0) {
                IERC20(auction.currency).safeTransfer(auction.seller, surplus);
            }
        } else {
            // Partial recovery - use insurance fund for bad debt
            lpRecovery = auction.soldPrice;
            uint256 shortfall = auction.debtOwed - auction.soldPrice;

            // Try to cover from insurance fund
            if (insuranceFund[auction.currency] >= shortfall) {
                insuranceFund[auction.currency] -= shortfall;
                lpRecovery += shortfall;
                badDebtCovered = shortfall;
                emit BadDebtCovered(auction.currency, shortfall);
            } else if (insuranceFund[auction.currency] > 0) {
                // Partial coverage
                badDebtCovered = insuranceFund[auction.currency];
                lpRecovery += badDebtCovered;
                insuranceFund[auction.currency] = 0;
                emit BadDebtCovered(auction.currency, badDebtCovered);
            }
        }

        // Transfer LP recovery to lending pool
        if (lpRecovery > 0 && lendingPool != address(0)) {
            IERC20(auction.currency).safeTransfer(lendingPool, lpRecovery);
        }

        // Clear token auction mapping
        delete tokenAuction[auction.tokenId];

        emit AuctionSettled(auctionId, auction.buyer, auction.soldPrice, lpRecovery, badDebtCovered);
    }

    /**
     * @notice Cancel auction (admin only)
     * @param auctionId Auction ID
     * @param reason Cancellation reason
     */
    function cancelAuction(uint256 auctionId, string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");

        auction.status = AuctionStatus.Cancelled;
        delete tokenAuction[auction.tokenId];

        emit AuctionCancelled(auctionId, reason);
    }

    /**
     * @notice Cover bad debt from insurance fund (manual trigger)
     * @param currency Currency address
     * @param amount Amount to cover
     * @param recipient Recipient of funds
     */
    function coverBadDebt(address currency, uint256 amount, address recipient)
        external
        onlyRole(KEEPER_ROLE)
        nonReentrant
    {
        require(insuranceFund[currency] >= amount, "Insufficient insurance");
        require(recipient != address(0), "Invalid recipient");

        insuranceFund[currency] -= amount;
        IERC20(currency).safeTransfer(recipient, amount);

        emit BadDebtCovered(currency, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get auction details
     * @param auctionId Auction ID
     */
    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @notice Get auction by token ID
     * @param tokenId NFT token ID
     */
    function getAuctionByToken(uint256 tokenId) external view returns (uint256) {
        return tokenAuction[tokenId];
    }

    /**
     * @notice Get insurance fund balance
     * @param currency Currency address
     */
    function getInsuranceFundBalance(address currency) external view returns (uint256) {
        return insuranceFund[currency];
    }

    /**
     * @notice Check if auction is active
     * @param auctionId Auction ID
     */
    function isAuctionActive(uint256 auctionId) external view returns (bool) {
        return auctions[auctionId].status == AuctionStatus.Active;
    }

    /**
     * @notice Get time remaining in auction
     * @param auctionId Auction ID
     */
    function getTimeRemaining(uint256 auctionId) external view returns (uint256) {
        Auction memory auction = auctions[auctionId];
        if (auction.status != AuctionStatus.Active || block.timestamp >= auction.endTime) {
            return 0;
        }
        return auction.endTime - block.timestamp;
    }

    /**
     * @notice Required for receiving ERC721 tokens
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
