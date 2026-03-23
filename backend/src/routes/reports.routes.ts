import { Router } from 'express'
import { JobModel } from '../models/Job'
import { MilestoneModel } from '../models/Milestone'
import { TransactionModel } from '../models/Transaction'

export const reportsRoutes = Router()

reportsRoutes.get('/job/:jobId', async (req, res) => {
  const job = await JobModel.findById(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  const milestones = await MilestoneModel.find({ jobId: job._id }).sort({ index: 1 })
  const transactions = await TransactionModel.find({ jobId: job._id }).sort({ createdAt: -1 })

  const completed = milestones.filter((m) => m.status === 'RELEASED').length
  const trustScore = {
    score: Math.max(40, Math.min(95, 70 + completed * 5)),
    level: completed > 0 ? 'SAFE' : 'MEDIUM',
    rationale: [
      `Milestones completed: ${completed}/${milestones.length}`,
      `Total transactions: ${transactions.length}`,
    ],
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    job,
    milestones,
    transactions,
    trustScore,
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename=job-${job._id}-report.json`)
  return res.send(JSON.stringify(payload, null, 2))
})
