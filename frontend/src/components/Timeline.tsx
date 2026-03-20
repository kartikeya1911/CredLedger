import { clsx } from 'clsx'
import { formatDate } from '../utils/format'

export type TimelineItem = {
  title: string
  description: string
  date?: string
  status?: 'success' | 'warning' | 'danger' | 'info'
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="relative pl-8">
          <div className="absolute left-2 top-1.5 h-full w-px bg-white/10" />
          <span
            className={clsx(
              'absolute left-0 top-1 inline-flex h-3 w-3 rounded-full ring-4 ring-white/10',
              item.status === 'success' && 'bg-emerald-400',
              item.status === 'warning' && 'bg-amber-400',
              item.status === 'danger' && 'bg-rose-400',
              item.status === 'info' && 'bg-cyan-400',
            )}
          />
          <div className="text-sm font-semibold text-white">{item.title}</div>
          <div className="text-xs text-slate-400">{item.description}</div>
          <div className="text-[11px] text-slate-500">{formatDate(item.date)}</div>
        </div>
      ))}
    </div>
  )
}
