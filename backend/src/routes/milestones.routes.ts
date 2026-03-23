import { Router } from 'express'
import { z } from 'zod'
import { MilestoneModel } from '../models/Milestone'
import { JobModel } from '../models/Job'
import { TransactionModel } from '../models/Transaction'
import { verifyEscrowTransaction } from '../services/blockchain.service'
import { authenticate, requireRole } from '../middlewares/auth.middleware'

export const milestonesRoutes = Router()

function paramId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id
}

async function loadMilestone(id: string | undefined) {
  if (!id) return null
  const milestone = await MilestoneModel.findById(id)
  if (!milestone) return null
  const job = await JobModel.findById(milestone.jobId)
  return { milestone, job }
}

milestonesRoutes.get('/:id', authenticate, async (req, res) => {
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  return res.json(doc)
})

const submitSchema = z.object({
  message: z.string().min(5),
  submitHash: z.string().min(5).optional(),
})

milestonesRoutes.post('/:id/submit', authenticate, requireRole('FREELANCER'), async (req, res) => {
  const data = submitSchema.parse(req.body)
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  if (!job?.selectedFreelancerId || String(job.selectedFreelancerId) !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }
  if (milestone.status !== 'FUNDED') {
    return res.status(400).json({ error: 'BAD_STATE' })
  }
  milestone.submission = {
    message: data.message,
    submitHash: data.submitHash,
    submittedAt: new Date(),
    attachments: [],
  } as any
  milestone.status = 'SUBMITTED'
  await milestone.save()
  return res.json({ ok: true })
})

milestonesRoutes.post('/:id/approve', authenticate, requireRole('CLIENT'), async (req, res) => {
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  if (String(job!.clientId) !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN' })
  if (milestone.status !== 'SUBMITTED') return res.status(400).json({ error: 'BAD_STATE' })
  milestone.status = 'APPROVED'
  milestone.approval = { approvedAt: new Date() }
  await milestone.save()
  return res.json({ ok: true })
})

const depositSchema = z.object({
  amountPaise: z.number().int().positive().optional(),
  txHash: z.string().min(5),
  contractAddress: z.string().min(5).optional(),
  chainId: z.number().int().optional(),
  fromAddress: z.string().optional(),
})

milestonesRoutes.post('/:id/deposit', authenticate, requireRole('CLIENT'), async (req, res) => {
  const data = depositSchema.parse(req.body)
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  if (String(job!.clientId) !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['AWAITING_FUNDING', 'FUNDED_PENDING_CHAIN'].includes(milestone.status)) {
    return res.status(400).json({ error: 'BAD_STATE' })
  }
  const amountPaise = data.amountPaise ?? milestone.amountPaise

  // Ensure escrow address stored if provided
  if (!job!.escrow?.contractAddress && data.contractAddress) {
    job!.escrow = { contractAddress: data.contractAddress, chainId: data.chainId ?? job!.escrow?.chainId }
    await job!.save()
  }

  if (!job!.escrow?.contractAddress) return res.status(400).json({ error: 'ESCROW_NOT_CREATED' })

  const existingTx = await TransactionModel.findOne({ 'chain.txHash': data.txHash })
  if (existingTx) return res.json({ ok: true, txId: existingTx._id })

  const { chainId, confirmations } = await verifyEscrowTransaction({
    txHash: data.txHash,
    contractAddress: job!.escrow!.contractAddress,
    expectedEvent: 'MilestoneFunded',
    milestoneId: milestone.index,
    amountWei: BigInt(amountPaise),
    fromAddress: data.fromAddress,
  })

  const tx = await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise,
    status: 'SUCCESS',
    chain: {
      chainId: chainId ?? data.chainId ?? job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: data.txHash,
      eventName: 'Deposit',
    },
  })

  milestone.status = 'FUNDED'
  milestone.chain = {
    ...milestone.chain,
    lastTxHash: tx.chain?.txHash,
    escrowAddress: job!.escrow?.contractAddress,
    milestoneIdOnchain: milestone.index,
  }
  await milestone.save()
  return res.json({ ok: true, txId: tx._id, confirmations })
})

const releaseSchema = z.object({
  txHash: z.string().min(5),
  chainId: z.number().int().optional(),
  fromAddress: z.string().optional(),
})

milestonesRoutes.post('/:id/release', authenticate, async (req, res) => {
  const data = releaseSchema.parse(req.body)
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isOperator = ['ADMIN', 'ARBITRATOR'].includes(req.user!.role)
  if (!isClient && !isOperator) return res.status(403).json({ error: 'FORBIDDEN' })
  if (milestone.status !== 'APPROVED') {
    return res.status(400).json({ error: 'BAD_STATE' })
  }
  if (!job!.escrow?.contractAddress) return res.status(400).json({ error: 'ESCROW_NOT_CREATED' })

  const existingTx = await TransactionModel.findOne({ 'chain.txHash': data.txHash })
  if (existingTx) return res.json({ ok: true, txId: existingTx._id })

  const { chainId, confirmations } = await verifyEscrowTransaction({
    txHash: data.txHash,
    contractAddress: job!.escrow!.contractAddress,
    expectedEvent: 'MilestoneReleased',
    milestoneId: milestone.index,
    amountWei: BigInt(milestone.amountPaise),
    fromAddress: data.fromAddress,
  })

  milestone.status = 'RELEASED'
  milestone.chain = {
    ...milestone.chain,
    lastTxHash: data.txHash,
    escrowAddress: job!.escrow?.contractAddress,
    milestoneIdOnchain: milestone.index,
  }
  await milestone.save()

  const tx = await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise: milestone.amountPaise,
    status: 'SUCCESS',
    chain: {
      chainId: chainId ?? data.chainId ?? job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: data.txHash,
      eventName: 'MilestoneReleased',
    },
  })
  return res.json({ ok: true, txId: tx._id, confirmations })
})

const refundSchema = z.object({
  txHash: z.string().min(5),
  chainId: z.number().int().optional(),
  fromAddress: z.string().optional(),
})

const disputeSchema = z.object({
  txHash: z.string().min(5),
  chainId: z.number().int().optional(),
  fromAddress: z.string().optional(),
})

milestonesRoutes.post('/:id/dispute', authenticate, async (req, res) => {
  const data = disputeSchema.parse(req.body)
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isFreelancer = job!.selectedFreelancerId && String(job!.selectedFreelancerId) === req.user!.id
  if (!isClient && !isFreelancer) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['SUBMITTED', 'APPROVED', 'RELEASE_AUTHORIZED'].includes(milestone.status)) {
    return res.status(400).json({ error: 'BAD_STATE' })
  }
  if (!job!.escrow?.contractAddress) return res.status(400).json({ error: 'ESCROW_NOT_CREATED' })

  const existingTx = await TransactionModel.findOne({ 'chain.txHash': data.txHash })
  if (existingTx) return res.json({ ok: true, txId: existingTx._id })

  const { chainId, confirmations } = await verifyEscrowTransaction({
    txHash: data.txHash,
    contractAddress: job!.escrow!.contractAddress,
    expectedEvent: 'DisputeOpened',
    milestoneId: milestone.index,
    fromAddress: data.fromAddress,
  })

  milestone.status = 'DISPUTED'
  milestone.chain = {
    ...milestone.chain,
    lastTxHash: data.txHash,
    escrowAddress: job!.escrow?.contractAddress,
    milestoneIdOnchain: milestone.index,
  }
  await milestone.save()

  const tx = await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise: milestone.amountPaise,
    status: 'SUCCESS',
    chain: {
      chainId: chainId ?? data.chainId ?? job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: data.txHash,
      eventName: 'DisputeOpened',
    },
  })

  return res.json({ ok: true, txId: tx._id, confirmations })
})

milestonesRoutes.post('/:id/refund', authenticate, requireRole(['CLIENT', 'ADMIN', 'ARBITRATOR']), async (req, res) => {
  const data = refundSchema.parse(req.body)
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isAdmin = ['ADMIN', 'ARBITRATOR'].includes(req.user!.role)
  if (!isClient && !isAdmin) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['FUNDED', 'DISPUTED', 'APPROVED'].includes(milestone.status)) return res.status(400).json({ error: 'BAD_STATE' })
  if (!job!.escrow?.contractAddress) return res.status(400).json({ error: 'ESCROW_NOT_CREATED' })

  const existingTx = await TransactionModel.findOne({ 'chain.txHash': data.txHash })
  if (existingTx) return res.json({ ok: true, txId: existingTx._id })

  const { chainId, confirmations } = await verifyEscrowTransaction({
    txHash: data.txHash,
    contractAddress: job!.escrow!.contractAddress,
    expectedEvent: 'MilestoneRefunded',
    milestoneId: milestone.index,
    amountWei: BigInt(milestone.amountPaise),
    fromAddress: data.fromAddress,
  })

  milestone.status = 'REFUNDED'
  milestone.chain = {
    ...milestone.chain,
    lastTxHash: data.txHash,
    escrowAddress: job!.escrow?.contractAddress,
    milestoneIdOnchain: milestone.index,
  }
  await milestone.save()
  const tx = await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise: milestone.amountPaise,
    status: 'SUCCESS',
    chain: {
      chainId: chainId ?? data.chainId ?? job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: data.txHash,
      eventName: 'Refund',
    },
  })
  return res.json({ ok: true, txId: tx._id, confirmations })
})
