// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FreelanceEscrow.sol";

contract EscrowFactory {
    event EscrowCreated(
        address indexed escrow,
        address indexed client,
        address indexed freelancer,
        address arbitrator,
        address disputeModule
    );

    address public operator;
    address[] public escrows;

    error OnlyOperator();
    error InvalidAddress();
    error NoMilestones();

    constructor(address _operator) {
        operator = _operator;
    }

    function setOperator(address _operator) external {
        if (msg.sender != operator) revert OnlyOperator();
        operator = _operator;
    }

    function createEscrow(
        address client,
        address freelancer,
        address arbitrator,
        address disputeModule,
        uint256[] calldata milestoneAmounts
    ) external returns (address escrow) {
        if (msg.sender != operator) revert OnlyOperator();
        if (client == address(0) || freelancer == address(0) || arbitrator == address(0) || disputeModule == address(0)) {
            revert InvalidAddress();
        }
        if (milestoneAmounts.length == 0) revert NoMilestones();

        FreelanceEscrow e = new FreelanceEscrow(
            operator,
            client,
            freelancer,
            arbitrator,
            disputeModule,
            milestoneAmounts
        );
        escrow = address(e);
        escrows.push(escrow);
        emit EscrowCreated(escrow, client, freelancer, arbitrator, disputeModule);
    }

    function getEscrows() external view returns (address[] memory) {
        return escrows;
    }
}

