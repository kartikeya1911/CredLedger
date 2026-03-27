import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  glow?: boolean
}

const styles: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-glow hover:bg-primary-dark',
  secondary: 'bg-white/[0.05] text-slate-100 border border-white/[0.08] hover:bg-white/[0.08]',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/[0.05]',
  danger: 'bg-rose-600/90 text-white hover:bg-rose-500',
  success: 'bg-accent text-white shadow-glow-green hover:bg-accent/90',
}

const sizes = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, className, glow, ...rest }, ref) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed',
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
