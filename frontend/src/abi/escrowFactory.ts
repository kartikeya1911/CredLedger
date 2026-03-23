// Minimal ABI for EscrowFactory used in CredLedger
export const escrowFactoryAbi = [
  'function createEscrow(address client, address freelancer, address arbitrator, address disputeModule, uint256[] milestoneAmounts) returns (address)',
  'function operator() view returns (address)',
  'event EscrowCreated(address indexed escrow, address indexed client, address indexed freelancer, address arbitrator, address disputeModule)'
]

export type EscrowFactoryAbi = typeof escrowFactoryAbi
