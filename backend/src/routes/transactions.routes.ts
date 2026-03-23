import { Router } from 'express'
import { TransactionModel } from '../models/Transaction'
import { authenticate } from '../middlewares/auth.middleware'

export const transactionsRoutes = Router()

transactionsRoutes.get('/', authenticate, async (req, res) => {
  const items = await TransactionModel.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(100)
  return res.json({ items })
})
