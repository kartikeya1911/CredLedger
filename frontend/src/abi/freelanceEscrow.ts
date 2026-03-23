// Minimal ABI for FreelanceEscrow interactions used in the dApp
export const freelanceEscrowAbi = [
  'function depositToMilestone(uint256 milestoneId) payable',
  'function submitWork(uint256 milestoneId, bytes32 submitHash)',
  'function approve(uint256 milestoneId)',
  'function releaseToFreelancer(uint256 milestoneId)',
  'function refundClient(uint256 milestoneId)',
  'function openDispute(uint256 milestoneId)',
  'function getMilestone(uint256 milestoneId) view returns (uint256 amount, uint8 status, bytes32 submitHash)',
  'event MilestoneFunded(uint256 indexed milestoneId, uint256 amount)',
  'event WorkSubmitted(uint256 indexed milestoneId, bytes32 submitHash)',
  'event MilestoneApproved(uint256 indexed milestoneId)',
  'event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address recipient)',
  'event MilestoneRefunded(uint256 indexed milestoneId, uint256 amount, address recipient)',
  'event DisputeOpened(uint256 indexed milestoneId, address indexed openedBy)',
]

export type FreelanceEscrowAbi = typeof freelanceEscrowAbi
