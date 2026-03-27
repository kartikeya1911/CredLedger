import { Router } from 'express'
import { JobModel } from '../models/Job'
import { MilestoneModel } from '../models/Milestone'
import { TransactionModel } from '../models/Transaction'
import { authenticate } from '../middlewares/auth.middleware'

export const statsRoutes = Router()

/**
 * GET /stats/dashboard — Aggregated metrics for the current user.
 * Returns real-time data about jobs, milestones, transactions.
 */
statsRoutes.get('/dashboard', authenticate, async (req, res) => {
  const userId = req.user!.id
  const role = req.user!.role

  // Jobs owned by this user (client) or where they're the freelancer
  const jobFilter = role === 'CLIENT'
    ? { clientId: userId }
    : { selectedFreelancerId: userId }

  const allJobs = await JobModel.find(jobFilter).lean()
  const allJobIds = allJobs.map((j) => j._id)

  const activeJobs = allJobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length
  const completedJobs = allJobs.filter((j) => j.status === 'COMPLETED').length
  const totalVolume = allJobs.reduce((sum, j) => sum + (j.budget?.totalAmountPaise ?? 0), 0)

  // Milestones
  const milestones = await MilestoneModel.find({ jobId: { $in: allJobIds } }).lean()
  const pendingMilestones = milestones.filter((m) =>
    ['AWAITING_FUNDING', 'FUNDED_PENDING_CHAIN', 'FUNDED', 'SUBMITTED'].includes(m.status),
  ).length
  const releasedMilestones = milestones.filter((m) => m.status === 'RELEASED').length
  const disputedMilestones = milestones.filter((m) => m.status === 'DISPUTED').length

  // Transactions
  const transactions = await TransactionModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean()
  const successTx = transactions.filter((t) => t.status === 'SUCCESS').length
  const totalTx = transactions.length

  // Trust score — computed from real signals
  let trustScore = 50 // base score
  // Positive signals
  if (completedJobs > 0) trustScore += Math.min(completedJobs * 5, 20)
  if (releasedMilestones > 0) trustScore += Math.min(releasedMilestones * 3, 15)
  if (successTx > 0) trustScore += Math.min(successTx * 2, 10)
  // Negative signals
  if (disputedMilestones > 0) trustScore -= Math.min(disputedMilestones * 10, 30)
  // Clamp
  trustScore = Math.max(0, Math.min(100, trustScore))

  // Bridge health
  const latestTx = transactions[0]
  const lastTxAge = latestTx ? (Date.now() - new Date(latestTx.createdAt).getTime()) : Infinity
  const bridgeHealthy = lastTxAge < 24 * 60 * 60 * 1000 // healthy if tx in last 24h
  const chainTxCount = transactions.filter((t) => t.type === 'CHAIN_TX').length

  // Trust signals
  const signals: Array<{ text: string; positive: boolean }> = []
  if (completedJobs > 0) signals.push({ text: `${completedJobs} completed jobs`, positive: true })
  if (releasedMilestones > 0) signals.push({ text: `${releasedMilestones} milestones released on-time`, positive: true })
  if (successTx > 0) signals.push({ text: `${successTx} verified on-chain transactions`, positive: true })
  if (allJobs.some((j) => j.escrow?.contractAddress)) signals.push({ text: 'Escrow contracts verified', positive: true })
  if (disputedMilestones > 0) signals.push({ text: `${disputedMilestones} disputed milestones`, positive: false })
  if (completedJobs === 0 && allJobs.length > 0) signals.push({ text: 'No completed jobs yet', positive: false })
  if (chainTxCount === 0) signals.push({ text: 'No on-chain transactions yet', positive: false })

  // Recent decisions (from milestone status changes)
  const recentMilestones = milestones
    .filter((m) => ['RELEASED', 'APPROVED', 'DISPUTED', 'REFUNDED'].includes(m.status))
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 5)
    .map((m) => ({
      title: m.status === 'RELEASED' ? 'Funds Released' :
             m.status === 'APPROVED' ? 'Work Approved' :
             m.status === 'DISPUTED' ? 'Dispute Opened' :
             m.status === 'REFUNDED' ? 'Refund Processed' : m.status,
      description: m.title,
      status: ['RELEASED', 'APPROVED'].includes(m.status) ? 'success' :
              m.status === 'DISPUTED' ? 'warning' : 'info',
      date: m.updatedAt ?? m.createdAt,
    }))

  return res.json({
    metrics: {
      totalVolume,
      activeJobs,
      completedJobs,
      pendingMilestones,
      releasedMilestones,
      disputedMilestones,
      totalJobs: allJobs.length,
    },
    trustScore,
    signals,
    decisions: recentMilestones,
    bridge: {
      healthy: bridgeHealthy,
      chainTxCount,
      totalTxCount: totalTx,
      latestTxAt: latestTx?.createdAt ?? null,
      fraudAlerts: disputedMilestones,
    },
    profile: {
      jobsCompleted: completedJobs,
      totalJobs: allJobs.length,
      totalEarned: role === 'FREELANCER' ? totalVolume : 0,
      totalSpent: role === 'CLIENT' ? totalVolume : 0,
      rating: completedJobs > 0 ? Math.min(4.0 + (completedJobs * 0.2), 5.0) : 0,
      reviewCount: releasedMilestones,
    },
  })
})
