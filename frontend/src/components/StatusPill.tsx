import { clsx } from 'clsx'
import type { MilestoneStatus } from '../api/types'

const colorMap: Record<MilestoneStatus | 'UNKNOWN', string> = {
  DRAFT: 'badge-info',
  AWAITING_FUNDING: 'badge-warning',
  FUNDED_PENDING_CHAIN: 'badge-warning',
  FUNDED: 'badge-success',
  SUBMITTED: 'badge-info',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  RELEASE_AUTHORIZED: 'badge-info',
  RELEASED: 'badge-success',
  DISPUTED: 'badge-danger',
  REFUND_AUTHORIZED: 'badge-warning',
  REFUNDED: 'badge-warning',
  UNKNOWN: 'badge-info',
}

export function StatusPill({ status }: { status?: string }) {
  const key = (status as MilestoneStatus) ?? 'UNKNOWN'
  return <span className={clsx('pill capitalize', colorMap[key] ?? 'badge-info')}>{status?.toLowerCase() ?? 'unknown'}</span>
}
