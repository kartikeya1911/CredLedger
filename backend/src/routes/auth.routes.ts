import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

import { env } from '../config/env'
import { UserModel } from '../models/User'

export const authRoutes = Router()

const registerSchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER']),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8),
})

authRoutes.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body)

  if (!data.email && !data.phone) {
    return res.status(400).json({ error: 'VALIDATION', message: 'email or phone is required' })
  }

  const orFilters: Array<Record<string, unknown>> = []
  if (data.email) orFilters.push({ email: data.email })
  if (data.phone) orFilters.push({ phone: data.phone })

  const existing = await UserModel.findOne(orFilters.length ? { $or: orFilters } : {})
  if (existing) return res.status(409).json({ error: 'ALREADY_EXISTS' })

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await UserModel.create({
    role: data.role,
    email: data.email,
    phone: data.phone,
    passwordHash,
  })

  return res.status(201).json({ id: user._id })
})

const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(8),
})

authRoutes.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body)
  const user = await UserModel.findOne({
    $or: [{ email: data.emailOrPhone }, { phone: data.emailOrPhone }],
  })
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

  const ok = await bcrypt.compare(data.password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

  const accessToken = jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: '30m' })
  const refreshToken = jwt.sign({ sub: String(user._id) }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' })

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, role: user.role, email: user.email, phone: user.phone },
  })
})

authRoutes.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string }
    const user = await UserModel.findById(decoded.sub)
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json({ id: user._id, role: user.role, email: user.email, phone: user.phone })
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
})

