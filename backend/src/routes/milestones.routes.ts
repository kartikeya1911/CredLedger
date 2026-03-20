import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { MilestoneModel } from '../models/Milestone'
import { JobModel } from '../models/Job'
import { TransactionModel } from '../models/Transaction'
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
  if (!['FUNDED', 'APPROVED'].includes(milestone.status)) {
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

  const tx = await TransactionModel.create({
    type: 'UPI_COLLECT',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise,
    status: 'SUCCESS',
    provider: {
      orderId: `upi_${crypto.randomUUID()}`,
    },
    chain: {
      chainId: job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
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
  return res.json({ ok: true, txId: tx._id })
})

milestonesRoutes.post('/:id/release', authenticate, async (req, res) => {
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isOperator = ['ADMIN', 'ARBITRATOR'].includes(req.user!.role)
  if (!isClient && !isOperator) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['APPROVED', 'RELEASE_AUTHORIZED', 'DISPUTED'].includes(milestone.status)) {
    return res.status(400).json({ error: 'BAD_STATE' })
  }
  milestone.status = 'RELEASED'
  await milestone.save()
  await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job!._id,
    milestoneId: milestone._id,
    userId: req.user!.id,
    amountPaise: milestone.amountPaise,
    status: 'SUCCESS',
    chain: {
      chainId: job!.escrow?.chainId,
      contractAddress: job!.escrow?.contractAddress,
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      eventName: 'MilestoneReleased',
    },
  })
  return res.json({ ok: true })
})

milestonesRoutes.post('/:id/dispute', authenticate, async (req, res) => {
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isFreelancer = job!.selectedFreelancerId && String(job!.selectedFreelancerId) === req.user!.id
  if (!isClient && !isFreelancer) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['SUBMITTED', 'APPROVED'].includes(milestone.status)) return res.status(400).json({ error: 'BAD_STATE' })
  milestone.status = 'DISPUTED'
  await milestone.save()
  return res.json({ ok: true })
})

milestonesRoutes.post('/:id/refund', authenticate, requireRole(['CLIENT', 'ADMIN', 'ARBITRATOR']), async (req, res) => {
  const doc = await loadMilestone(paramId(req.params.id))
  if (!doc) return res.status(404).json({ error: 'NOT_FOUND' })
  const { milestone, job } = doc
  const isClient = String(job!.clientId) === req.user!.id
  const isAdmin = ['ADMIN', 'ARBITRATOR'].includes(req.user!.role)
  if (!isClient && !isAdmin) return res.status(403).json({ error: 'FORBIDDEN' })
  if (!['FUNDED', 'DISPUTED', 'APPROVED'].includes(milestone.status)) return res.status(400).json({ error: 'BAD_STATE' })
  milestone.status = 'REFUNDED'
  await milestone.save()
  return res.json({ ok: true })
})
