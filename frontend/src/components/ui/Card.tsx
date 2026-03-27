import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2 } : undefined}
      className={clsx(
        'glass rounded-xl p-5 transition-colors',
        hover && 'hover:border-white/[0.1]',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
