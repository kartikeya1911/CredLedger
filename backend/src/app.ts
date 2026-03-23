import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { authRoutes } from './routes/auth.routes'
import { jobsRoutes } from './routes/jobs.routes'
import { webhooksRoutes } from './routes/webhooks.routes'
import { milestonesRoutes } from './routes/milestones.routes'
import { escrowRoutes } from './routes/escrow.routes'
import { reportsRoutes } from './routes/reports.routes'
import { transactionsRoutes } from './routes/transactions.routes'
import { notFound, errorHandler } from './middlewares/error.middleware'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: true, credentials: true }))

  // Webhooks often need raw body; keep webhook route before json parser.
  app.use('/api/v1/webhooks', webhooksRoutes)

  app.use(express.json({ limit: '2mb' }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/jobs', jobsRoutes)
  app.use('/api/v1/milestones', milestonesRoutes)
  app.use('/api/v1/escrow', escrowRoutes)
  app.use('/api/v1/reports', reportsRoutes)
  app.use('/api/v1/transactions', transactionsRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

