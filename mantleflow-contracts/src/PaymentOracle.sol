// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./LendingPool.sol";

/**
 * @title PaymentOracle
 * @notice Bridge off-chain payment → on-chain cho MantleFlow
 * @dev Multi-sig 2/3 oracle nodes confirm, Challenge period 24h
 */
contract PaymentOracle is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_NODE_ROLE = keccak256("ORACLE_NODE_ROLE");

    LendingPool public lendingPool;

    uint256 public constant REQUIRED_CONFIRMATIONS = 2;
    uint256 public constant CHALLENGE_PERIOD = 24 hours;

    enum PaymentStatus {
        Pending, // 0: Submitted, waiting confirmations
        Confirmed, // 1: Got 2/3 confirmations, in challenge period
        Executed, // 2: Payment executed
        Challenged, // 3: Under dispute
        Rejected // 4: Rejected by dispute resolution
    }

    struct Payment {
        uint256 loanId;
        uint256 amount;
        bytes32 proofHash; // Off-chain payment proof hash
        address submitter;
        uint256 submittedAt;
        uint256 confirmationCount;
        uint256 challengeEndTime;
        PaymentStatus status;
    }

    struct PaymentChallenge {
        address challenger;
        string reason;
        uint256 createdAt;
        bool resolved;
    }

    uint256 private _nextPaymentId;
    mapping(uint256 => Payment) public payments;
    mapping(uint256 => PaymentChallenge) public paymentChallenges;

    // paymentId => oracleNode => hasConfirmed
    mapping(uint256 => mapping(address => bool)) public confirmations;

    // List of oracle nodes
    address[] public oracleNodes;

    // Events
    event PaymentSubmitted(
        uint256 indexed paymentId, uint256 indexed loanId, uint256 amount, bytes32 proofHash, address submitter
    );

    event PaymentConfirmed(uint256 indexed paymentId, address indexed oracle, uint256 confirmationCount);

    event PaymentReadyForExecution(uint256 indexed paymentId, uint256 challengeEndTime);

    event PaymentExecuted(uint256 indexed paymentId, uint256 indexed loanId, uint256 amount);

    event PaymentChallenged(uint256 indexed paymentId, address indexed challenger, string reason);

    event PaymentChallengeResolved(uint256 indexed paymentId, bool accepted, string resolution);

    event OracleNodeAdded(address indexed node);
    event OracleNodeRemoved(address indexed node);

    constructor(address _lendingPool) {
        require(_lendingPool != address(0), "Invalid lending pool");
        lendingPool = LendingPool(_lendingPool);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add oracle node
     * @param node Oracle node address
     */
    function addOracleNode(address node) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(node != address(0), "Invalid address");
        require(!hasRole(ORACLE_NODE_ROLE, node), "Already oracle");

        _grantRole(ORACLE_NODE_ROLE, node);
        oracleNodes.push(node);

        emit OracleNodeAdded(node);
    }

    /**
     * @notice Remove oracle node
     * @param node Oracle node address
     */
    function removeOracleNode(address node) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(ORACLE_NODE_ROLE, node), "Not oracle");

        _revokeRole(ORACLE_NODE_ROLE, node);

        // Remove from list
        for (uint256 i = 0; i < oracleNodes.length; i++) {
            if (oracleNodes[i] == node) {
                oracleNodes[i] = oracleNodes[oracleNodes.length - 1];
                oracleNodes.pop();
                break;
            }
        }

        emit OracleNodeRemoved(node);
    }

    // ============ Oracle Functions ============

    /**
     * @notice Submit payment proof (oracle or anyone can submit)
     * @param loanId Loan ID
     * @param amount Payment amount
     * @param proofHash Hash of off-chain payment proof
     */
    function submitPayment(uint256 loanId, uint256 amount, bytes32 proofHash) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(proofHash != bytes32(0), "Invalid proof hash");

        // Verify loan exists and is active/overdue
        LendingPool.Loan memory loan = lendingPool.getLoan(loanId);
        require(
            loan.status == LendingPool.LoanStatus.Active || loan.status == LendingPool.LoanStatus.Overdue,
            "Loan not active/overdue"
        );

        uint256 paymentId = ++_nextPaymentId;

        payments[paymentId] = Payment({
            loanId: loanId,
            amount: amount,
            proofHash: proofHash,
            submitter: msg.sender,
            submittedAt: block.timestamp,
            confirmationCount: 0,
            challengeEndTime: 0,
            status: PaymentStatus.Pending
        });

        emit PaymentSubmitted(paymentId, loanId, amount, proofHash, msg.sender);

        // Auto-confirm if submitter is oracle
        if (hasRole(ORACLE_NODE_ROLE, msg.sender)) {
            _confirmPayment(paymentId, msg.sender);
        }

        return paymentId;
    }

    /**
     * @notice Confirm payment (oracle nodes only)
     * @param paymentId Payment ID
     */
    function confirmPayment(uint256 paymentId) external onlyRole(ORACLE_NODE_ROLE) nonReentrant {
        _confirmPayment(paymentId, msg.sender);
    }

    /**
     * @dev Internal confirm logic
     */
    function _confirmPayment(uint256 paymentId, address oracle) internal {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Pending, "Not pending");
        require(!confirmations[paymentId][oracle], "Already confirmed");

        confirmations[paymentId][oracle] = true;
        payment.confirmationCount++;

        emit PaymentConfirmed(paymentId, oracle, payment.confirmationCount);

        // Check if we have enough confirmations
        if (payment.confirmationCount >= REQUIRED_CONFIRMATIONS) {
            payment.status = PaymentStatus.Confirmed;
            payment.challengeEndTime = block.timestamp + CHALLENGE_PERIOD;

            emit PaymentReadyForExecution(paymentId, payment.challengeEndTime);
        }
    }

    /**
     * @notice Execute payment after challenge period
     * @param paymentId Payment ID
     */
    function executePayment(uint256 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Confirmed, "Not confirmed");
        require(block.timestamp >= payment.challengeEndTime, "Challenge period active");

        payment.status = PaymentStatus.Executed;

        // --- CRITICAL FIX: Gateway Liquidity Model ---
        // 1. Get Loan currency
        LendingPool.Loan memory loan = lendingPool.getLoan(payment.loanId);
        IERC20 currency = IERC20(loan.currency);

        // 2. Pull tokens from Gateway (msg.sender) to this contract
        // Gateway must approve PaymentOracle before calling
        currency.safeTransferFrom(msg.sender, address(this), payment.amount);

        // 3. Approve LendingPool to pull from this contract
        currency.forceApprove(address(lendingPool), payment.amount);

        // 4. Execute repayment on LendingPool
        lendingPool.repay(payment.loanId, payment.amount);
        // ---------------------------------------------

        emit PaymentExecuted(paymentId, payment.loanId, payment.amount);
    }

    /**
     * @notice Challenge payment during challenge period
     * @param paymentId Payment ID
     * @param reason Reason for challenge
     */
    function challengePayment(uint256 paymentId, string calldata reason) external nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Confirmed, "Not in confirmed status");
        require(block.timestamp < payment.challengeEndTime, "Challenge period ended");
        require(bytes(reason).length > 0, "Reason required");

        payment.status = PaymentStatus.Challenged;

        paymentChallenges[paymentId] =
            PaymentChallenge({challenger: msg.sender, reason: reason, createdAt: block.timestamp, resolved: false});

        emit PaymentChallenged(paymentId, msg.sender, reason);
    }

    /**
     * @notice Resolve payment challenge (admin only)
     * @param paymentId Payment ID
     * @param accepted Whether challenge is accepted
     * @param resolution Resolution details
     */
    function resolvePaymentChallenge(uint256 paymentId, bool accepted, string calldata resolution)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Challenged, "Not challenged");

        PaymentChallenge storage challenge = paymentChallenges[paymentId];
        require(!challenge.resolved, "Already resolved");

        challenge.resolved = true;

        if (accepted) {
            payment.status = PaymentStatus.Rejected;
        } else {
            // Resume to confirmed, reset challenge period
            payment.status = PaymentStatus.Confirmed;
            payment.challengeEndTime = block.timestamp + CHALLENGE_PERIOD;
        }

        emit PaymentChallengeResolved(paymentId, accepted, resolution);
    }

    // ============ View Functions ============

    /**
     * @notice Get payment details
     * @param paymentId Payment ID
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @notice Get payment challenge details
     * @param paymentId Payment ID
     */
    function getPaymentChallenge(uint256 paymentId) external view returns (PaymentChallenge memory) {
        return paymentChallenges[paymentId];
    }

    /**
     * @notice Check if oracle has confirmed
     * @param paymentId Payment ID
     * @param oracle Oracle address
     */
    function hasConfirmed(uint256 paymentId, address oracle) external view returns (bool) {
        return confirmations[paymentId][oracle];
    }

    /**
     * @notice Get all oracle nodes
     */
    function getOracleNodes() external view returns (address[] memory) {
        return oracleNodes;
    }

    /**
     * @notice Get oracle node count
     */
    function getOracleNodeCount() external view returns (uint256) {
        return oracleNodes.length;
    }

    /**
     * @notice Check if payment is in challenge period
     * @param paymentId Payment ID
     */
    function isInChallengePeriod(uint256 paymentId) external view returns (bool) {
        Payment memory payment = payments[paymentId];
        return payment.status == PaymentStatus.Confirmed && block.timestamp < payment.challengeEndTime;
    }
}
