// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InvoiceNFT
 * @notice Token hoa hoa don thanh NFT (ERC-721) cho MantleFlow
 * @dev Luu tru metadata cua invoice on-chain
 */
contract InvoiceNFT is ERC721, ERC721Enumerable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 private _nextTokenId;

    enum RiskTier {
        A,
        B,
        C,
        D
    }

    struct InvoiceData {
        bytes32 invoiceHash; // SHA-256 of document
        bytes32 debtorConfirmationHash; // Hash of debtor confirmation
        uint256 dueDate; // Due date timestamp
        uint256 amount; // Invoice amount in base currency
        RiskTier riskTier; // A, B, C, D
        bytes32 kycProofHash; // KYC verification proof
        uint256 osintScore; // OSINT score (0-100)
        address creditor; // Original creditor address
        uint256 createdAt; // Timestamp of minting
        bool isActive; // Is NFT active (not burned)
    }

    // tokenId => InvoiceData
    mapping(uint256 => InvoiceData) private _invoices;

    // invoiceHash => tokenId (prevent duplicates)
    mapping(bytes32 => uint256) private _invoiceHashToTokenId;

    // Events
    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed creditor,
        bytes32 invoiceHash,
        uint256 amount,
        uint256 dueDate,
        RiskTier riskTier
    );

    event InvoiceBurned(uint256 indexed tokenId, address indexed burner, string reason);

    event InvoiceDataUpdated(uint256 indexed tokenId, bytes32 debtorConfirmationHash);

    constructor() ERC721("MantleFlow Invoice", "MFINV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    /**
     * @notice Mint NFT voi metadata
     * @param to Address nhan NFT
     * @param invoiceHash SHA-256 hash cua document
     * @param dueDate Due date timestamp
     * @param amount Invoice amount
     * @param riskTier Risk tier (0=A, 1=B, 2=C, 3=D)
     * @param kycProofHash KYC proof hash
     * @param osintScore OSINT score (0-100)
     */
    function mint(
        address to,
        bytes32 invoiceHash,
        uint256 dueDate,
        uint256 amount,
        RiskTier riskTier,
        bytes32 kycProofHash,
        uint256 osintScore
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(invoiceHash != bytes32(0), "Invalid invoice hash");
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp, "Due date must be future");
        require(osintScore <= 100, "OSINT score must be 0-100");
        require(_invoiceHashToTokenId[invoiceHash] == 0, "Invoice already minted");

        uint256 tokenId = ++_nextTokenId;

        _invoices[tokenId] = InvoiceData({
            invoiceHash: invoiceHash,
            debtorConfirmationHash: bytes32(0),
            dueDate: dueDate,
            amount: amount,
            riskTier: riskTier,
            kycProofHash: kycProofHash,
            osintScore: osintScore,
            creditor: to,
            createdAt: block.timestamp,
            isActive: true
        });

        _invoiceHashToTokenId[invoiceHash] = tokenId;
        _safeMint(to, tokenId);

        emit InvoiceMinted(tokenId, to, invoiceHash, amount, dueDate, riskTier);

        return tokenId;
    }

    /**
     * @notice Update debtor confirmation hash
     * @param tokenId Token ID
     * @param debtorConfirmationHash Hash cua debtor confirmation
     */
    function setDebtorConfirmation(uint256 tokenId, bytes32 debtorConfirmationHash) external onlyRole(MINTER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(_invoices[tokenId].isActive, "Invoice is not active");

        _invoices[tokenId].debtorConfirmationHash = debtorConfirmationHash;

        emit InvoiceDataUpdated(tokenId, debtorConfirmationHash);
    }

    /**
     * @notice Burn NFT khi phat hien gian lan
     * @param tokenId Token ID to burn
     * @param reason Reason for burning
     */
    function burn(uint256 tokenId, string calldata reason) external onlyRole(BURNER_ROLE) nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(_invoices[tokenId].isActive, "Already burned");

        _invoices[tokenId].isActive = false;

        // Clear invoice hash mapping
        bytes32 invoiceHash = _invoices[tokenId].invoiceHash;
        delete _invoiceHashToTokenId[invoiceHash];

        _burn(tokenId);

        emit InvoiceBurned(tokenId, msg.sender, reason);
    }

    /**
     * @notice Get invoice data
     * @param tokenId Token ID
     * @return InvoiceData struct
     */
    function getInvoiceData(uint256 tokenId) external view returns (InvoiceData memory) {
        require(_ownerOf(tokenId) != address(0) || !_invoices[tokenId].isActive, "Token does not exist");
        return _invoices[tokenId];
    }

    /**
     * @notice Get token ID by invoice hash
     * @param invoiceHash Invoice hash
     * @return tokenId
     */
    function getTokenByInvoiceHash(bytes32 invoiceHash) external view returns (uint256) {
        return _invoiceHashToTokenId[invoiceHash];
    }

    /**
     * @notice Check if invoice is active
     * @param tokenId Token ID
     */
    function isInvoiceActive(uint256 tokenId) external view returns (bool) {
        return _invoices[tokenId].isActive;
    }

    /**
     * @notice Get LTV based on risk tier
     * @param tier Risk tier
     * @return LTV percentage (80, 60, 40, 0)
     */
    function getLTVByTier(RiskTier tier) public pure returns (uint256) {
        if (tier == RiskTier.A) return 80;
        if (tier == RiskTier.B) return 60;
        if (tier == RiskTier.C) return 40;
        return 0; // Tier D = reject
    }

    /**
     * @notice Get interest rate based on risk tier
     * @param tier Risk tier
     * @return Interest rate in basis points (500, 800, 1200, 0)
     */
    function getInterestRateByTier(RiskTier tier) public pure returns (uint256) {
        if (tier == RiskTier.A) return 500; // 5%
        if (tier == RiskTier.B) return 800; // 8%
        if (tier == RiskTier.C) return 1200; // 12%
        return 0; // Tier D = reject
    }

    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
