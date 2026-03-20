import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'

type UserPayload = { sub: string; role: 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'ARBITRATOR' }

function getToken(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length)
  return null
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req)
    if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as UserPayload
    req.user = { id: decoded.sub, role: decoded.role }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}

export function requireRole(roles: UserPayload['role'][] | UserPayload['role']) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' })
    if (!allowed.includes(req.user.role as UserPayload['role'])) {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
    return next()
  }
}