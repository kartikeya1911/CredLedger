import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'from-aurora to-cyber',
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  accent?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass relative overflow-hidden rounded-2.5xl p-4 shadow-card"
    >
      <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.18), transparent 50%)' }} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
          {sub && <div className="text-xs text-slate-400">{sub}</div>}
        </div>
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', accent)}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
