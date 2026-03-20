// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceEscrow is ReentrancyGuard {
    enum Status {
        CREATED,
        FUNDED,
        SUBMITTED,
        APPROVED,
        RELEASE_AUTHORIZED,
        RELEASED,
        DISPUTED,
        REFUND_AUTHORIZED,
        REFUNDED
    }

    enum DisputeDecision {
        RELEASE_TO_FREELANCER,
        REFUND_TO_CLIENT,
        SPLIT
    }

    struct Milestone {
        uint256 amount;
        Status status;
        bytes32 submitHash;
    }

    address public operator;
    address public client;
    address public freelancer;
    address public arbitrator;
    address public disputeModule;

    uint256 public immutable milestoneCount;
    mapping(uint256 => Milestone) private milestones;
    mapping(uint256 => bool) public disputeOpen;

    event MilestoneFunded(uint256 indexed milestoneId, uint256 amount);
    event WorkSubmitted(uint256 indexed milestoneId, bytes32 submitHash);
    event MilestoneApproved(uint256 indexed milestoneId);
    event MilestoneReleaseAuthorized(uint256 indexed milestoneId, uint256 amount);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address recipient);
    event DisputeOpened(uint256 indexed milestoneId, address indexed openedBy);
    event DisputeResolved(uint256 indexed milestoneId, DisputeDecision decision, uint16 splitBps);
    event MilestoneRefundAuthorized(uint256 indexed milestoneId, uint256 amount);
    event MilestoneRefunded(uint256 indexed milestoneId, uint256 amount, address recipient);
    event MilestoneSplitPaid(
        uint256 indexed milestoneId,
        uint256 freelancerAmount,
        uint256 clientRefundAmount,
        address freelancer,
        address client
    );

    error OnlyOperator();
    error OnlyClient();
    error OnlyFreelancer();
    error OnlyArbitrator();
    error OnlyDisputeModule();
    error InvalidMilestone();
    error InvalidAddress();
    error BadState();
    error BadAmount();
    error BadSplit();
    error UnauthorizedParty();

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperator();
        _;
    }

    modifier onlyClient() {
        if (msg.sender != client) revert OnlyClient();
        _;
    }

    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert OnlyFreelancer();
        _;
    }

    modifier onlyArbitrator() {
        if (msg.sender != arbitrator) revert OnlyArbitrator();
        _;
    }

    modifier onlyDisputeModule() {
        if (msg.sender != disputeModule) revert OnlyDisputeModule();
        _;
    }

    constructor(
        address _operator,
        address _client,
        address _freelancer,
        address _arbitrator,
        address _disputeModule,
        uint256[] memory milestoneAmounts
    ) {
        if (
            _operator == address(0) ||
            _client == address(0) ||
            _freelancer == address(0) ||
            _arbitrator == address(0) ||
            _disputeModule == address(0)
        ) {
            revert InvalidAddress();
        }

        operator = _operator;
        client = _client;
        freelancer = _freelancer;
        arbitrator = _arbitrator;
        disputeModule = _disputeModule;

        milestoneCount = milestoneAmounts.length;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            if (milestoneAmounts[i] == 0) revert BadAmount();
            milestones[i] = Milestone({amount: milestoneAmounts[i], status: Status.CREATED, submitHash: bytes32(0)});
        }
    }

    function getMilestone(uint256 milestoneId) external view returns (uint256 amount, Status status, bytes32 submitHash) {
        Milestone memory m = _getMilestone(milestoneId);
        return (m.amount, m.status, m.submitHash);
    }

    function depositToMilestone(uint256 milestoneId) external payable onlyClient nonReentrant {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.CREATED) revert BadState();
        if (msg.value != m.amount) revert BadAmount();

        m.status = Status.FUNDED;
        emit MilestoneFunded(milestoneId, msg.value);
    }

    function submitWork(uint256 milestoneId, bytes32 submitHash) external onlyFreelancer {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.FUNDED) revert BadState();
        m.submitHash = submitHash;
        m.status = Status.SUBMITTED;
        emit WorkSubmitted(milestoneId, submitHash);
    }

    function approve(uint256 milestoneId) external onlyClient {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.SUBMITTED) revert BadState();
        m.status = Status.APPROVED;
        emit MilestoneApproved(milestoneId);
    }

    function authorizeRelease(uint256 milestoneId) external onlyOperator {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.APPROVED) revert BadState();
        m.status = Status.RELEASE_AUTHORIZED;
        emit MilestoneReleaseAuthorized(milestoneId, m.amount);
    }

    function releaseToFreelancer(uint256 milestoneId) external onlyOperator nonReentrant {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.RELEASE_AUTHORIZED && m.status != Status.APPROVED) revert BadState();
        m.status = Status.RELEASED;
        _payout(payable(freelancer), m.amount);
        emit MilestoneReleased(milestoneId, m.amount, freelancer);
    }

    function openDispute(uint256 milestoneId) external {
        if (msg.sender != client && msg.sender != freelancer) revert UnauthorizedParty();
        Milestone storage m = _getMilestone(milestoneId);
        if (
            m.status != Status.SUBMITTED &&
            m.status != Status.APPROVED &&
            m.status != Status.RELEASE_AUTHORIZED
        ) {
            revert BadState();
        }
        m.status = Status.DISPUTED;
        disputeOpen[milestoneId] = true;
        emit DisputeOpened(milestoneId, msg.sender);
    }

    function authorizeRefund(uint256 milestoneId) external onlyOperator {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.FUNDED && m.status != Status.APPROVED && m.status != Status.DISPUTED) revert BadState();
        m.status = Status.REFUND_AUTHORIZED;
        emit MilestoneRefundAuthorized(milestoneId, m.amount);
    }

    function refundClient(uint256 milestoneId) external onlyOperator nonReentrant {
        Milestone storage m = _getMilestone(milestoneId);
        if (m.status != Status.REFUND_AUTHORIZED) revert BadState();
        m.status = Status.REFUNDED;
        _payout(payable(client), m.amount);
        emit MilestoneRefunded(milestoneId, m.amount, client);
    }

    function resolveDisputeFromDAO(
        uint256 milestoneId,
        DisputeDecision decision,
        uint16 splitBps
    ) external onlyDisputeModule nonReentrant {
        Milestone storage m = _getMilestone(milestoneId);
        if (!disputeOpen[milestoneId] || m.status != Status.DISPUTED) revert BadState();
        disputeOpen[milestoneId] = false;

        if (decision == DisputeDecision.RELEASE_TO_FREELANCER) {
            m.status = Status.RELEASED;
            _payout(payable(freelancer), m.amount);
            emit MilestoneReleased(milestoneId, m.amount, freelancer);
        } else if (decision == DisputeDecision.REFUND_TO_CLIENT) {
            m.status = Status.REFUNDED;
            _payout(payable(client), m.amount);
            emit MilestoneRefunded(milestoneId, m.amount, client);
        } else {
            if (splitBps == 0 || splitBps >= 10000) revert BadSplit();
            m.status = Status.RELEASED;
            uint256 freelancerAmount = (m.amount * uint256(splitBps)) / 10000;
            uint256 clientAmount = m.amount - freelancerAmount;
            _payout(payable(freelancer), freelancerAmount);
            _payout(payable(client), clientAmount);
            emit MilestoneSplitPaid(milestoneId, freelancerAmount, clientAmount, freelancer, client);
        }

        emit DisputeResolved(milestoneId, decision, splitBps);
    }

    function setDisputeModule(address newModule) external onlyArbitrator {
        if (newModule == address(0)) revert InvalidAddress();
        disputeModule = newModule;
    }

    function _getMilestone(uint256 milestoneId) internal view returns (Milestone storage) {
        if (milestoneId >= milestoneCount) revert InvalidMilestone();
        return milestones[milestoneId];
    }

    function _payout(address payable recipient, uint256 amount) private {
        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "TRANSFER_FAILED");
    }
}

