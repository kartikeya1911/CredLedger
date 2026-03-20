import type { NextFunction, Request, Response } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: 'NOT_FOUND', message: `No route: ${req.method} ${req.path}` })
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // eslint-disable-next-line no-console
  console.error(err)
  if (err && typeof err === 'object' && 'issues' in err) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: (err as any).issues })
  }
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
}

