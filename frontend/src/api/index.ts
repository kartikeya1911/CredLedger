import { api, setAuthToken } from './client'
import type { Job, Milestone, Transaction, User } from './types'

export async function login(emailOrPhone: string, password: string) {
  const res = await api.post('/auth/login', { emailOrPhone, password })
  const { accessToken, user } = res.data as { accessToken: string; user: User }
  setAuthToken(accessToken)
  return { user, token: accessToken }
}

export async function register(role: string, email: string, password: string) {
  await api.post('/auth/register', { role, email, password })
  return login(email, password)
}

export async function fetchMe(): Promise<User | null> {
  try {
    const res = await api.get('/auth/me')
    return res.data as User
  } catch (err) {
    return null
  }
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await api.get('/jobs')
  return res.data.items as Job[]
}

export type CreateJobInput = {
  title: string
  description: string
  skills?: string[]
  totalAmountPaise?: number
  milestones: { title: string; description?: string; amountPaise: number }[]
}

export async function createJob(payload: CreateJobInput): Promise<{ id: string }> {
  const res = await api.post('/jobs', payload)
  return res.data as { id: string }
}

export async function fetchJob(jobId: string): Promise<{ job: Job; milestones: Milestone[] }> {
  const res = await api.get(`/jobs/${jobId}`)
  return res.data as { job: Job; milestones: Milestone[] }
}

export async function applyToJob(jobId: string, coverLetter: string, bidPaise: number) {
  await api.post(`/jobs/${jobId}/apply`, { coverLetter, bidPaise })
}

export async function acceptFreelancer(jobId: string, freelancerId: string) {
  await api.post(`/jobs/${jobId}/accept`, { freelancerId })
}

export async function createJobEscrow(jobId: string, body: { contractAddress: string; txHash: string; chainId?: number }) {
  await api.post(`/jobs/${jobId}/escrow`, body)
}

export async function milestoneAction(milestoneId: string, action: string, body?: Record<string, unknown>) {
  await api.post(`/milestones/${milestoneId}/${action}`, body ?? {})
}

export async function fetchTransactions(): Promise<Transaction[]> {
  // Placeholder until backend route exists; keep UI functional with empty array.
  try {
    const res = await api.get('/transactions')
    return res.data.items as Transaction[]
  } catch (err) {
    return []
  }
}

export async function fetchEscrow(contractAddress: string) {
  const res = await api.get(`/escrow/${contractAddress}`)
  return res.data as { job: Job; milestones: Milestone[]; transactions: Transaction[] }
}

export async function downloadJobReport(jobId: string): Promise<Blob> {
  const res = await api.get(`/reports/job/${jobId}`, { responseType: 'blob' })
  return res.data as Blob
}
