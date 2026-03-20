// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDisputableEscrow {
    enum DisputeDecision {
        RELEASE_TO_FREELANCER,
        REFUND_TO_CLIENT,
        SPLIT
    }

    function resolveDisputeFromDAO(
        uint256 milestoneId,
        DisputeDecision decision,
        uint16 splitBps
    ) external;
}

contract DisputeDAO {
    event DisputeCreated(
        uint256 indexed disputeId,
        address indexed escrow,
        uint256 indexed milestoneId,
        address[] voters,
        uint64 endTime,
        uint16 splitBps
    );
    event VoteCast(uint256 indexed disputeId, address indexed voter, uint8 choice);
    event DisputeFinalized(uint256 indexed disputeId, IDisputableEscrow.DisputeDecision decision);

    struct Dispute {
        address escrow;
        uint256 milestoneId;
        uint64 endTime;
        uint16 splitBps;
        uint256 releaseVotes;
        uint256 refundVotes;
        uint256 splitVotes;
        bool executed;
        mapping(address => bool) allowed;
        mapping(address => bool) voted;
    }

    address public operator;
    Dispute[] private disputes;

    error OnlyOperator();
    error NotVoter();
    error AlreadyVoted();
    error VotingClosed();
    error InvalidChoice();
    error InvalidAddress();
    error InvalidInput();
    error AlreadyFinalized();

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperator();
        _;
    }

    constructor(address _operator) {
        if (_operator == address(0)) revert InvalidAddress();
        operator = _operator;
    }

    function createDispute(
        address escrow,
        uint256 milestoneId,
        address[] calldata voters,
        uint64 votingPeriodSeconds,
        uint16 splitBps
    ) external onlyOperator returns (uint256 disputeId) {
        if (escrow == address(0) || voters.length == 0 || votingPeriodSeconds == 0) revert InvalidInput();
        if (splitBps >= 10000 && splitBps != 0) revert InvalidInput();

        disputeId = disputes.length;
        disputes.push();
        Dispute storage d = disputes[disputeId];
        d.escrow = escrow;
        d.milestoneId = milestoneId;
        d.endTime = uint64(block.timestamp + votingPeriodSeconds);
        d.splitBps = splitBps;

        for (uint256 i = 0; i < voters.length; i++) {
            d.allowed[voters[i]] = true;
        }

        emit DisputeCreated(disputeId, escrow, milestoneId, voters, d.endTime, splitBps);
    }

    function vote(uint256 disputeId, uint8 choice) external {
        Dispute storage d = disputes[disputeId];
        if (!d.allowed[msg.sender]) revert NotVoter();
        if (d.voted[msg.sender]) revert AlreadyVoted();
        if (block.timestamp >= d.endTime) revert VotingClosed();

        // 0 = release, 1 = refund, 2 = split
        if (choice == 0) {
            d.releaseVotes += 1;
        } else if (choice == 1) {
            d.refundVotes += 1;
        } else if (choice == 2) {
            if (d.splitBps == 0) revert InvalidChoice();
            d.splitVotes += 1;
        } else {
            revert InvalidChoice();
        }

        d.voted[msg.sender] = true;
        emit VoteCast(disputeId, msg.sender, choice);
    }

    function finalize(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        if (block.timestamp < d.endTime) revert VotingClosed();
        if (d.executed) revert AlreadyFinalized();

        d.executed = true;

        IDisputableEscrow.DisputeDecision decision;
        if (d.releaseVotes >= d.refundVotes && d.releaseVotes >= d.splitVotes) {
            decision = IDisputableEscrow.DisputeDecision.RELEASE_TO_FREELANCER;
        } else if (d.refundVotes >= d.releaseVotes && d.refundVotes >= d.splitVotes) {
            decision = IDisputableEscrow.DisputeDecision.REFUND_TO_CLIENT;
        } else {
            decision = IDisputableEscrow.DisputeDecision.SPLIT;
        }

        IDisputableEscrow(d.escrow).resolveDisputeFromDAO(d.milestoneId, decision, d.splitBps);
        emit DisputeFinalized(disputeId, decision);
    }

    function getDispute(uint256 disputeId)
        external
        view
        returns (
            address escrow,
            uint256 milestoneId,
            uint64 endTime,
            uint16 splitBps,
            uint256 releaseVotes,
            uint256 refundVotes,
            uint256 splitVotes,
            bool executed
        )
    {
        Dispute storage d = disputes[disputeId];
        return (d.escrow, d.milestoneId, d.endTime, d.splitBps, d.releaseVotes, d.refundVotes, d.splitVotes, d.executed);
    }
}
