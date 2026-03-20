import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  glow?: boolean
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-aurora to-cyber text-white shadow-glow hover:shadow-lg hover:from-aurora/90 hover:to-cyber/90',
  secondary: 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/5',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
}

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, className, glow, ...rest }, ref) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-aurora/60',
        styles[variant],
        sizes[size],
        glow && 'shadow-glow',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  ),
)

Button.displayName = 'Button'
