import { Router } from 'express'
import { z } from 'zod'
import { JobModel } from '../models/Job'
import { MilestoneModel } from '../models/Milestone'
import { TransactionModel } from '../models/Transaction'
import { authenticate, requireRole } from '../middlewares/auth.middleware'
import { verifyFactoryCreation } from '../services/blockchain.service'

export const jobsRoutes = Router()

jobsRoutes.get('/', async (_req, res) => {
  const jobs = await JobModel.find().sort({ createdAt: -1 }).limit(50)
  res.json({ items: jobs })
})

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  skills: z.array(z.string()).default([]),
  totalAmountPaise: z.coerce.number().int().positive().optional(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        amountPaise: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
})

jobsRoutes.post('/', authenticate, requireRole('CLIENT'), async (req, res) => {
  const data = createJobSchema.parse(req.body)
  const total = data.totalAmountPaise ?? data.milestones.reduce((sum, m) => sum + m.amountPaise, 0)

  const job = await JobModel.create({
    clientId: req.user!.id,
    title: data.title,
    description: data.description,
    skills: data.skills,
    budget: { currency: 'INR', totalAmountPaise: total },
    status: 'OPEN',
  })

  await MilestoneModel.insertMany(
    data.milestones.map((m, idx) => ({
      jobId: job._id,
      index: idx,
      title: m.title,
      description: m.description,
      amountPaise: m.amountPaise,
      status: 'AWAITING_FUNDING',
    })),
  )

  res.status(201).json({ id: job._id })
})

jobsRoutes.get('/:jobId', async (req, res) => {
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  const milestones = await MilestoneModel.find({ jobId: job._id }).sort({ index: 1 })
  return res.json({ job, milestones })
})

const applySchema = z.object({
  coverLetter: z.string().min(10),
  bidPaise: z.number().int().positive(),
})

jobsRoutes.post('/:jobId/apply', authenticate, requireRole('FREELANCER'), async (req, res) => {
  const data = applySchema.parse(req.body)
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  if (job.status !== 'OPEN') return res.status(400).json({ error: 'JOB_NOT_OPEN' })

  const already = job.applications?.find((a) => String(a.freelancerId) === req.user!.id)
  if (already) return res.status(409).json({ error: 'ALREADY_APPLIED' })

  const applications = job.applications ?? []
  applications.push({
    freelancerId: req.user!.id as any,
    coverLetter: data.coverLetter,
    bidPaise: data.bidPaise,
    status: 'APPLIED',
    appliedAt: new Date(),
  } as any)
  job.applications = applications as any
  await job.save()
  return res.json({ ok: true })
})

const acceptSchema = z.object({
  freelancerId: z.string().min(1),
  contractAddress: z.string().min(5).optional(),
  chainId: z.number().int().optional(),
  txHash: z.string().min(5).optional(),
})

jobsRoutes.post('/:jobId/accept', authenticate, requireRole('CLIENT'), async (req, res) => {
  const data = acceptSchema.parse(req.body)
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  if (String(job.clientId) !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN' })
  if (job.status !== 'OPEN') return res.status(400).json({ error: 'JOB_NOT_OPEN' })

  const app = job.applications?.find((a) => String(a.freelancerId) === data.freelancerId)
  if (!app) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' })

  job.selectedFreelancerId = data.freelancerId as any
  job.status = 'IN_PROGRESS'
  if (data.contractAddress) {
    job.escrow = {
      ...job.escrow,
      contractAddress: data.contractAddress,
      chainId: data.chainId ?? job.escrow?.chainId,
    }
  }
  job.applications = job.applications?.map((a) => ({
    ...a.toObject?.() ?? a,
    status: String(a.freelancerId) === data.freelancerId ? 'ACCEPTED' : 'REJECTED',
  })) as any
  await job.save()

  // Optional: record contract creation tx
  if (data.txHash) {
    await TransactionModel.create({
      type: 'CHAIN_TX',
      jobId: job._id,
      userId: req.user!.id,
      amountPaise: job.budget?.totalAmountPaise ?? 0,
      status: 'SUCCESS',
      chain: {
        chainId: data.chainId ?? job.escrow?.chainId,
        contractAddress: job.escrow?.contractAddress,
        txHash: data.txHash,
        eventName: 'EscrowCreated',
      },
    })
  }
  return res.json({ ok: true })
})

const addMilestoneSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  amountPaise: z.coerce.number().int().positive(),
})

jobsRoutes.post('/:jobId/milestones', authenticate, requireRole('CLIENT'), async (req, res) => {
  const data = addMilestoneSchema.parse(req.body)
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  if (String(job.clientId) !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN' })

  const maxIndex = await MilestoneModel.find({ jobId: job._id }).sort({ index: -1 }).limit(1)
  const nextIndex = maxIndex[0]?.index != null ? maxIndex[0].index + 1 : 0

  const milestone = await MilestoneModel.create({
    jobId: job._id,
    index: nextIndex,
    title: data.title,
    description: data.description,
    amountPaise: data.amountPaise,
    status: 'AWAITING_FUNDING',
  })

  // Defensive: ensure budget is initialized before incrementing
  const budget = job.budget ?? ({ currency: 'INR', totalAmountPaise: 0 } as any)
  budget.totalAmountPaise += data.amountPaise
  job.budget = budget
  await job.save()

  return res.status(201).json({ id: milestone._id })
})

const escrowCreateSchema = z.object({
  contractAddress: z.string().min(5),
  txHash: z.string().min(5),
  chainId: z.number().int().optional(),
})

jobsRoutes.post('/:jobId/escrow', authenticate, requireRole('CLIENT'), async (req, res) => {
  const data = escrowCreateSchema.parse(req.body)
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  if (String(job.clientId) !== req.user!.id) return res.status(403).json({ error: 'FORBIDDEN' })

  if (job.escrow?.contractAddress && job.escrow.contractAddress.toLowerCase() === data.contractAddress.toLowerCase()) {
    return res.json({ ok: true, contractAddress: job.escrow.contractAddress })
  }

  const { chainId } = await verifyFactoryCreation({ txHash: data.txHash, expectedEscrow: data.contractAddress })

  const chainIdToStore = chainId ?? data.chainId ?? job.escrow?.chainId
  job.escrow = {
    ...(job.escrow ?? ({} as any)),
    contractAddress: data.contractAddress,
    chainId: chainIdToStore,
  }
  await job.save()

  await TransactionModel.create({
    type: 'CHAIN_TX',
    jobId: job._id,
    userId: req.user!.id,
    amountPaise: job.budget?.totalAmountPaise ?? 0,
    status: 'SUCCESS',
    chain: {
      chainId: chainIdToStore,
      contractAddress: data.contractAddress,
      txHash: data.txHash,
      eventName: 'EscrowCreated',
    },
  })

  return res.json({ ok: true, contractAddress: data.contractAddress })
})

