// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./InvoiceNFT.sol";
import "./Escrow.sol";

/**
 * @title LendingPool
 * @notice Quan ly pool cho vay MantleFlow
 * @dev Multi-currency, Challenge Period 24h, Interest rates by tier
 */
contract LendingPool is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Contracts
    InvoiceNFT public invoiceNFT;
    Escrow public escrow;
    address public liquidator;

    // Constants
    uint256 public constant CHALLENGE_PERIOD = 24 hours;
    uint256 public constant ORIGINATION_FEE_BPS = 100; // 1%
    uint256 public constant INSURANCE_FEE_BPS = 500; // 5% of origination fee
    uint256 public constant PENALTY_RATE_MULTIPLIER = 200; // 2x interest rate for overdue
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Loan status enum
    enum LoanStatus {
        Pending, // 0: In challenge period (24h)
        Active, // 1: Loan is active
        Overdue, // 2: Past due date
        Defaulted, // 3: 14+ days overdue
        Liquidated, // 4: NFT liquidated
        Repaid, // 5: Fully repaid
        Challenged // 6: Under dispute
    }

    struct Loan {
        uint256 tokenId; // Invoice NFT token ID
        address borrower; // Borrower address
        address currency; // Loan currency (ERC20)
        uint256 principal; // Principal amount
        uint256 interestRate; // Interest rate in BPS
        uint256 dueDate; // Loan due date
        uint256 createdAt; // Loan creation timestamp
        uint256 challengeEndTime; // Challenge period end time
        uint256 repaidAmount; // Amount repaid
        LoanStatus status; // Current status
        InvoiceNFT.RiskTier tier; // Risk tier
        uint256 penaltyRate; // Penalty interest rate (BPS)
    }

    struct Challenge {
        address challenger;
        string reason;
        uint256 createdAt;
        bool resolved;
        bool accepted;
    }

    // State
    uint256 private _nextLoanId;
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => Challenge) public challenges;

    // Supported currencies
    mapping(address => bool) public supportedCurrencies;
    address[] public currencyList;

    // Liquidity provider deposits
    mapping(address => mapping(address => uint256)) public lpDeposits; // lp => currency => amount
    mapping(address => uint256) public totalDeposits; // currency => total

    // Available liquidity (not locked in loans)
    mapping(address => uint256) public availableLiquidity; // currency => amount

    // Insurance fund
    mapping(address => uint256) public insuranceFund; // currency => amount

    // Events
    event CurrencyAdded(address indexed currency);
    event CurrencyRemoved(address indexed currency);

    event Deposited(address indexed lp, address indexed currency, uint256 amount);
    event Withdrawn(address indexed lp, address indexed currency, uint256 amount);

    event LoanCreated(
        uint256 indexed loanId,
        uint256 indexed tokenId,
        address indexed borrower,
        address currency,
        uint256 principal,
        uint256 dueDate,
        InvoiceNFT.RiskTier tier
    );

    event LoanActivated(uint256 indexed loanId, uint256 timestamp);
    event LoanRepaid(uint256 indexed loanId, uint256 amount, uint256 totalRepaid, bool fullyRepaid);
    event LoanOverdue(uint256 indexed loanId, uint256 daysOverdue);
    event LoanDefaulted(uint256 indexed loanId, uint256 timestamp);
    event LoanLiquidated(uint256 indexed loanId, uint256 timestamp);

    event LoanChallenged(uint256 indexed loanId, address indexed challenger, string reason);
    event ChallengeResolved(uint256 indexed loanId, bool accepted, string resolution);

    event InsuranceFundContribution(address indexed currency, uint256 amount);

    constructor(address _invoiceNFT, address _escrow) {
        require(_invoiceNFT != address(0), "Invalid NFT address");
        require(_escrow != address(0), "Invalid escrow address");

        invoiceNFT = InvoiceNFT(_invoiceNFT);
        escrow = Escrow(_escrow);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    // ============ Admin Functions ============

    function setLiquidator(address _liquidator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_liquidator != address(0), "Invalid liquidator");
        liquidator = _liquidator;
    }

    function addCurrency(address currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(currency != address(0), "Invalid currency");
        require(!supportedCurrencies[currency], "Already supported");

        supportedCurrencies[currency] = true;
        currencyList.push(currency);

        emit CurrencyAdded(currency);
    }

    function removeCurrency(address currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(supportedCurrencies[currency], "Not supported");
        require(totalDeposits[currency] == 0, "Has deposits");

        supportedCurrencies[currency] = false;

        // Remove from list
        for (uint256 i = 0; i < currencyList.length; i++) {
            if (currencyList[i] == currency) {
                currencyList[i] = currencyList[currencyList.length - 1];
                currencyList.pop();
                break;
            }
        }

        emit CurrencyRemoved(currency);
    }

    // ============ LP Functions ============

    /**
     * @notice Deposit liquidity
     * @param currency Currency address
     * @param amount Amount to deposit
     */
    function deposit(address currency, uint256 amount) external nonReentrant {
        require(supportedCurrencies[currency], "Currency not supported");
        require(amount > 0, "Amount must be positive");

        IERC20(currency).safeTransferFrom(msg.sender, address(this), amount);

        lpDeposits[msg.sender][currency] += amount;
        totalDeposits[currency] += amount;
        availableLiquidity[currency] += amount;

        emit Deposited(msg.sender, currency, amount);
    }

    /**
     * @notice Withdraw liquidity
     * @param currency Currency address
     * @param amount Amount to withdraw
     */
    function withdraw(address currency, uint256 amount) external nonReentrant {
        require(lpDeposits[msg.sender][currency] >= amount, "Insufficient balance");
        require(availableLiquidity[currency] >= amount, "Insufficient liquidity");

        lpDeposits[msg.sender][currency] -= amount;
        totalDeposits[currency] -= amount;
        availableLiquidity[currency] -= amount;

        IERC20(currency).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, currency, amount);
    }

    // ============ Loan Functions ============

    /**
     * @notice Create loan - status starts as Pending (24h challenge period)
     * @param tokenId Invoice NFT token ID
     * @param currency Loan currency
     */
    function createLoan(uint256 tokenId, address currency) external nonReentrant returns (uint256) {
        require(supportedCurrencies[currency], "Currency not supported");
        require(invoiceNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        // Get invoice data
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoiceData(tokenId);
        require(invoice.isActive, "Invoice not active");
        require(invoice.riskTier != InvoiceNFT.RiskTier.D, "Tier D rejected");

        // Calculate loan terms
        uint256 ltv = invoiceNFT.getLTVByTier(invoice.riskTier);
        uint256 principal = (invoice.amount * ltv) / 100;
        uint256 interestRate = invoiceNFT.getInterestRateByTier(invoice.riskTier);

        // Check liquidity
        uint256 originationFee = (principal * ORIGINATION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPrincipal = principal - originationFee;
        require(availableLiquidity[currency] >= netPrincipal, "Insufficient liquidity");

        // Transfer NFT to escrow
        invoiceNFT.transferFrom(msg.sender, address(escrow), tokenId);

        // Create loan
        uint256 loanId = ++_nextLoanId;

        loans[loanId] = Loan({
            tokenId: tokenId,
            borrower: msg.sender,
            currency: currency,
            principal: principal,
            interestRate: interestRate,
            dueDate: invoice.dueDate,
            createdAt: block.timestamp,
            challengeEndTime: block.timestamp + CHALLENGE_PERIOD,
            repaidAmount: 0,
            status: LoanStatus.Pending,
            tier: invoice.riskTier,
            penaltyRate: interestRate * PENALTY_RATE_MULTIPLIER / 100 // Double interest
        });

        // Lock NFT in escrow
        escrow.lockNFT(tokenId, msg.sender, loanId);

        // Reserve liquidity (but don't disburse yet)
        availableLiquidity[currency] -= netPrincipal;

        // Add to insurance fund
        uint256 insuranceContribution = (originationFee * INSURANCE_FEE_BPS) / BPS_DENOMINATOR;
        insuranceFund[currency] += insuranceContribution;

        emit LoanCreated(loanId, tokenId, msg.sender, currency, principal, invoice.dueDate, invoice.riskTier);

        emit InsuranceFundContribution(currency, insuranceContribution);

        return loanId;
    }

    /**
     * @notice Activate loan after challenge period
     * @param loanId Loan ID
     */
    function activateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "Not pending");
        require(block.timestamp >= loan.challengeEndTime, "Challenge period active");

        loan.status = LoanStatus.Active;

        // Calculate and disburse
        uint256 originationFee = (loan.principal * ORIGINATION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPrincipal = loan.principal - originationFee;

        // Transfer to borrower
        IERC20(loan.currency).safeTransfer(loan.borrower, netPrincipal);

        emit LoanActivated(loanId, block.timestamp);
    }

    /**
     * @notice Repay loan
     * @param loanId Loan ID
     * @param amount Amount to repay
     */
    function repay(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active || loan.status == LoanStatus.Overdue, "Loan not active/overdue");
        require(amount > 0, "Amount must be positive");

        // Calculate total owed
        uint256 totalOwed = calculateTotalOwed(loanId);
        uint256 remaining = totalOwed - loan.repaidAmount;

        uint256 actualRepayment = amount > remaining ? remaining : amount;

        // Transfer from borrower
        IERC20(loan.currency).safeTransferFrom(msg.sender, address(this), actualRepayment);

        loan.repaidAmount += actualRepayment;
        availableLiquidity[loan.currency] += actualRepayment;

        bool fullyRepaid = loan.repaidAmount >= totalOwed;
        if (fullyRepaid) {
            loan.status = LoanStatus.Repaid;
            // Release NFT
            escrow.releaseNFT(loan.tokenId, loanId);
        }

        emit LoanRepaid(loanId, actualRepayment, loan.repaidAmount, fullyRepaid);
    }

    /**
     * @notice Challenge loan during challenge period
     * @param loanId Loan ID
     * @param reason Reason for challenge
     */
    function challengeLoan(uint256 loanId, string calldata reason) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "Not in pending status");
        require(block.timestamp < loan.challengeEndTime, "Challenge period ended");
        require(bytes(reason).length > 0, "Reason required");

        loan.status = LoanStatus.Challenged;

        challenges[loanId] = Challenge({
            challenger: msg.sender, reason: reason, createdAt: block.timestamp, resolved: false, accepted: false
        });

        emit LoanChallenged(loanId, msg.sender, reason);
    }

    /**
     * @notice Resolve challenge (admin only)
     * @param loanId Loan ID
     * @param accepted Whether challenge is accepted
     * @param resolution Resolution details
     */
    function resolveChallenge(uint256 loanId, bool accepted, string calldata resolution)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Challenged, "Not challenged");

        Challenge storage challenge = challenges[loanId];
        require(!challenge.resolved, "Already resolved");

        challenge.resolved = true;
        challenge.accepted = accepted;

        if (accepted) {
            // Cancel loan, return liquidity, release NFT
            uint256 originationFee = (loan.principal * ORIGINATION_FEE_BPS) / BPS_DENOMINATOR;
            uint256 netPrincipal = loan.principal - originationFee;
            availableLiquidity[loan.currency] += netPrincipal;

            escrow.releaseNFT(loan.tokenId, loanId);
            loan.status = LoanStatus.Repaid; // Mark as closed
        } else {
            // Resume to pending, extend challenge period
            loan.status = LoanStatus.Pending;
            loan.challengeEndTime = block.timestamp + CHALLENGE_PERIOD;
        }

        emit ChallengeResolved(loanId, accepted, resolution);
    }

    /**
     * @notice Mark loan as overdue (keeper function)
     * @param loanId Loan ID
     */
    function markOverdue(uint256 loanId) external onlyRole(KEEPER_ROLE) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Not active");
        require(block.timestamp > loan.dueDate, "Not overdue yet");

        loan.status = LoanStatus.Overdue;

        uint256 daysOverdue = (block.timestamp - loan.dueDate) / 1 days;
        emit LoanOverdue(loanId, daysOverdue);
    }

    /**
     * @notice Mark loan as defaulted (14+ days overdue)
     * @param loanId Loan ID
     */
    function markDefaulted(uint256 loanId) external onlyRole(KEEPER_ROLE) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Overdue, "Not overdue");
        require(block.timestamp > loan.dueDate + 14 days, "Not 14 days overdue");

        loan.status = LoanStatus.Defaulted;
        emit LoanDefaulted(loanId, block.timestamp);
    }

    /**
     * @notice Start liquidation process
     * @param loanId Loan ID
     */
    function startLiquidation(uint256 loanId) external onlyRole(KEEPER_ROLE) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Defaulted, "Not defaulted");
        require(liquidator != address(0), "Liquidator not set");

        loan.status = LoanStatus.Liquidated;

        // Transfer NFT to liquidator
        escrow.transferToLiquidator(loan.tokenId, loanId, liquidator);

        emit LoanLiquidated(loanId, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate total amount owed including interest
     * @param loanId Loan ID
     */
    function calculateTotalOwed(uint256 loanId) public view returns (uint256) {
        Loan memory loan = loans[loanId];

        uint256 timeElapsed = block.timestamp > loan.createdAt ? block.timestamp - loan.createdAt : 0;
        uint256 normalInterestDuration = timeElapsed;
        uint256 penaltyInterestDuration = 0;

        // If overdue, split duration
        if (block.timestamp > loan.dueDate) {
            uint256 overdueTime = block.timestamp - loan.dueDate;
            if (overdueTime < timeElapsed) {
                normalInterestDuration = timeElapsed - overdueTime;
                penaltyInterestDuration = overdueTime;
            } else {
                normalInterestDuration = 0;
                penaltyInterestDuration = timeElapsed;
            }
        }

        uint256 normalInterest =
            (loan.principal * loan.interestRate * normalInterestDuration) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        // Apply penalty rate for overdue period (or use standard rate if 0 for older loans)
        uint256 effectivePenaltyRate = loan.penaltyRate > 0 ? loan.penaltyRate : loan.interestRate;
        uint256 penaltyInterest =
            (loan.principal * effectivePenaltyRate * penaltyInterestDuration) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        return loan.principal + normalInterest + penaltyInterest;
    }

    /**
     * @notice Get loan details
     * @param loanId Loan ID
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @notice Get challenge details
     * @param loanId Loan ID
     */
    function getChallenge(uint256 loanId) external view returns (Challenge memory) {
        return challenges[loanId];
    }

    /**
     * @notice Get all supported currencies
     */
    function getSupportedCurrencies() external view returns (address[] memory) {
        return currencyList;
    }

    /**
     * @notice Get LP balance
     * @param lp LP address
     * @param currency Currency address
     */
    function getLPBalance(address lp, address currency) external view returns (uint256) {
        return lpDeposits[lp][currency];
    }

    /**
     * @notice Check if loan is in challenge period
     * @param loanId Loan ID
     */
    function isInChallengePeriod(uint256 loanId) external view returns (bool) {
        Loan memory loan = loans[loanId];
        return loan.status == LoanStatus.Pending && block.timestamp < loan.challengeEndTime;
    }
}
