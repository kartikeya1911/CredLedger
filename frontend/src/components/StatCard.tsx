import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'from-primary to-secondary',
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  accent?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass relative overflow-hidden rounded-xl p-5"
    >
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted_text font-medium">{label}</div>
          <div className="mt-1.5 text-2xl font-display font-bold text-white">{value}</div>
          {sub && <div className="text-xs text-muted_text mt-0.5">{sub}</div>}
        </div>
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', accent)}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
