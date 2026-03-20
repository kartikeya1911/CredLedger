export type Role = 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'ARBITRATOR'

export type User = {
  id: string
  role: Role
  email?: string
  phone?: string
}

export type JobApplication = {
  freelancerId: string
  coverLetter?: string
  bidPaise?: number
  status: 'APPLIED' | 'ACCEPTED' | 'REJECTED'
  appliedAt?: string
}

export type Job = {
  _id: string
  title: string
  description: string
  status: string
  clientId: string
  selectedFreelancerId?: string
  skills?: string[]
  budget?: { currency: string; totalAmountPaise: number }
  applications?: JobApplication[]
  escrow?: { contractAddress?: string; chainId?: number }
  createdAt?: string
}

export type MilestoneStatus =
  | 'DRAFT'
  | 'AWAITING_FUNDING'
  | 'FUNDED_PENDING_CHAIN'
  | 'FUNDED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RELEASE_AUTHORIZED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUND_AUTHORIZED'
  | 'REFUNDED'

export type Milestone = {
  _id: string
  jobId: string
  index: number
  title: string
  description?: string
  amountPaise: number
  status: MilestoneStatus
  submission?: { message?: string; submitHash?: string; submittedAt?: string }
  approval?: { approvedAt?: string; note?: string }
  chain?: { escrowAddress?: string; milestoneIdOnchain?: number; lastTxHash?: string }
  createdAt?: string
}

export type Transaction = {
  _id: string
  type: 'UPI_COLLECT' | 'UPI_PAYOUT' | 'CHAIN_TX'
  amountPaise: number
  status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED'
  chain?: { chainId?: number; txHash?: string; contractAddress?: string; eventName?: string }
  provider?: { orderId?: string; paymentId?: string }
  createdAt?: string
  jobId?: string
  milestoneId?: string
}

export type TrustScore = {
  score: number
  level: 'SAFE' | 'MEDIUM' | 'RISKY'
  rationale: string[]
}
