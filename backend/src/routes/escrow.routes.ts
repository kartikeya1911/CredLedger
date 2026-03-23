import { Router } from 'express'
import { JobModel } from '../models/Job'
import { MilestoneModel } from '../models/Milestone'
import { TransactionModel } from '../models/Transaction'

export const escrowRoutes = Router()

escrowRoutes.get('/:address', async (req, res) => {
  const address = String(req.params.address).toLowerCase()
  const job = await JobModel.findOne({ 'escrow.contractAddress': { $regex: new RegExp(`^${address}$`, 'i') } })
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' })
  const milestones = await MilestoneModel.find({ jobId: job._id }).sort({ index: 1 })
  const transactions = await TransactionModel.find({ 'chain.contractAddress': job.escrow?.contractAddress }).sort({ createdAt: -1 })
  return res.json({ job, milestones, transactions })
})
