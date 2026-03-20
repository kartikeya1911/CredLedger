declare namespace Express {
  interface Request {
    user?: {
      id: string
      role: 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'ARBITRATOR'
    }
  }
}
