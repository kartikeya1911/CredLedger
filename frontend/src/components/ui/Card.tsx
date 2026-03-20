import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export function Card({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={hover ? { y: -2, scale: 1.003 } : undefined}
      className={clsx(
        'glass rounded-2.5xl p-5 shadow-card',
        'bg-gradient-to-br from-white/5 via-white/3 to-white/5',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
