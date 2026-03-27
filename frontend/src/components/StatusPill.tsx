import { clsx } from 'clsx'

const colorMap: Record<string, string> = {
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
  OPEN: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  COMPLETED: 'badge-success',
}

export function StatusPill({ status }: { status?: string }) {
  const key = status ?? 'UNKNOWN'
  return <span className={clsx('pill capitalize', colorMap[key] ?? 'badge-info')}>{status?.toLowerCase() ?? 'unknown'}</span>
}
