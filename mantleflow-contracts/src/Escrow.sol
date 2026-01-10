// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Escrow
 * @notice Giu NFT lam tai san dam bao cho MantleFlow
 * @dev Lock/release logic for invoice NFTs
 */
contract Escrow is IERC721Receiver, AccessControl, ReentrancyGuard {
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC721 public invoiceNFT;

    struct LockedNFT {
        address originalOwner;
        uint256 loanId;
        uint256 lockedAt;
        bool isLocked;
    }

    // tokenId => LockedNFT
    mapping(uint256 => LockedNFT) public lockedNFTs;

    // owner => tokenIds[]
    mapping(address => uint256[]) private _ownerLockedTokens;

    // Events
    event NFTLocked(uint256 indexed tokenId, address indexed owner, uint256 indexed loanId, uint256 timestamp);

    event NFTReleased(uint256 indexed tokenId, address indexed owner, uint256 indexed loanId, uint256 timestamp);

    event NFTTransferredToLiquidator(
        uint256 indexed tokenId, address indexed from, address indexed liquidator, uint256 loanId
    );

    constructor(address _invoiceNFT) {
        require(_invoiceNFT != address(0), "Invalid NFT address");
        invoiceNFT = IERC721(_invoiceNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Lock NFT khi tao loan
     * @param tokenId NFT token ID
     * @param owner Original owner of NFT
     * @param loanId Associated loan ID
     */
    function lockNFT(uint256 tokenId, address owner, uint256 loanId) external onlyRole(LENDING_POOL_ROLE) nonReentrant {
        require(!lockedNFTs[tokenId].isLocked, "NFT already locked");
        require(invoiceNFT.ownerOf(tokenId) == address(this), "NFT not transferred to escrow");

        lockedNFTs[tokenId] =
            LockedNFT({originalOwner: owner, loanId: loanId, lockedAt: block.timestamp, isLocked: true});

        _ownerLockedTokens[owner].push(tokenId);

        emit NFTLocked(tokenId, owner, loanId, block.timestamp);
    }

    /**
     * @notice Release NFT khi repay xong
     * @param tokenId NFT token ID
     * @param loanId Loan ID to verify
     */
    function releaseNFT(uint256 tokenId, uint256 loanId) external onlyRole(LENDING_POOL_ROLE) nonReentrant {
        require(lockedNFTs[tokenId].isLocked, "NFT not locked");
        require(lockedNFTs[tokenId].loanId == loanId, "Loan ID mismatch");

        address owner = lockedNFTs[tokenId].originalOwner;

        // Remove from owner's locked tokens
        _removeFromOwnerTokens(owner, tokenId);

        // Clear lock data
        delete lockedNFTs[tokenId];

        // Transfer back to owner
        invoiceNFT.safeTransferFrom(address(this), owner, tokenId);

        emit NFTReleased(tokenId, owner, loanId, block.timestamp);
    }

    /**
     * @notice Transfer NFT to liquidator khi default
     * @param tokenId NFT token ID
     * @param loanId Loan ID
     * @param liquidatorContract Address of liquidator contract
     */
    function transferToLiquidator(uint256 tokenId, uint256 loanId, address liquidatorContract)
        external
        onlyRole(LENDING_POOL_ROLE)
        nonReentrant
    {
        require(lockedNFTs[tokenId].isLocked, "NFT not locked");
        require(lockedNFTs[tokenId].loanId == loanId, "Loan ID mismatch");
        require(liquidatorContract != address(0), "Invalid liquidator");

        address originalOwner = lockedNFTs[tokenId].originalOwner;

        // Remove from owner's locked tokens
        _removeFromOwnerTokens(originalOwner, tokenId);

        // Clear lock data
        delete lockedNFTs[tokenId];

        // Transfer to liquidator
        invoiceNFT.safeTransferFrom(address(this), liquidatorContract, tokenId);

        emit NFTTransferredToLiquidator(tokenId, originalOwner, liquidatorContract, loanId);
    }

    /**
     * @notice Get locked NFT info
     * @param tokenId NFT token ID
     */
    function getLockedNFT(uint256 tokenId) external view returns (LockedNFT memory) {
        return lockedNFTs[tokenId];
    }

    /**
     * @notice Check if NFT is locked
     * @param tokenId NFT token ID
     */
    function isLocked(uint256 tokenId) external view returns (bool) {
        return lockedNFTs[tokenId].isLocked;
    }

    /**
     * @notice Get all locked tokens by owner
     * @param owner Owner address
     */
    function getLockedTokensByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerLockedTokens[owner];
    }

    /**
     * @notice Get original owner of locked NFT
     * @param tokenId NFT token ID
     */
    function getOriginalOwner(uint256 tokenId) external view returns (address) {
        return lockedNFTs[tokenId].originalOwner;
    }

    /**
     * @dev Remove tokenId from owner's locked tokens array
     */
    function _removeFromOwnerTokens(address owner, uint256 tokenId) private {
        uint256[] storage tokens = _ownerLockedTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    /**
     * @notice Required for receiving ERC721 tokens
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
