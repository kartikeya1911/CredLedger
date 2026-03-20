export const formatCurrency = (paise?: number) => {
  if (!paise) return '₹0.00'
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export const formatStatus = (status?: string) => status?.replace(/_/g, ' ') ?? 'Unknown'

export const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function trustColor(score: number) {
  if (score >= 80) return 'badge-success'
  if (score >= 50) return 'badge-warning'
  return 'badge-danger'
}
