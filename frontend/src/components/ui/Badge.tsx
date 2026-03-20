import { clsx } from 'clsx'

export function Badge({ label, tone = 'info', className }: { label: string; tone?: 'success' | 'warning' | 'danger' | 'info'; className?: string }) {
  const toneClass =
    tone === 'success'
      ? 'badge-success'
      : tone === 'warning'
        ? 'badge-warning'
        : tone === 'danger'
          ? 'badge-danger'
          : 'badge-info'
  return <span className={clsx(toneClass, className)}>{label}</span>
}
