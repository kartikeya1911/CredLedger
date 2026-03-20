import { Router } from 'express'
import crypto from 'crypto'
import { env } from '../config/env'

export const webhooksRoutes = Router()

// Capture raw body for signature verification.
webhooksRoutes.use(
  '/upi',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  (req, _res, next) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      ;(req as any).rawBody = data
      next()
    })
  },
)

webhooksRoutes.post('/upi', async (req, res) => {
  const signature = String(req.headers['x-webhook-signature'] ?? '')
  const rawBody = String((req as any).rawBody ?? '')

  const expected = crypto.createHmac('sha256', env.UPI_WEBHOOK_SECRET).update(rawBody).digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'INVALID_SIGNATURE' })
  }

  // TODO: parse gateway payload, apply idempotency, update transactions/milestones.
  return res.json({ ok: true })
})

