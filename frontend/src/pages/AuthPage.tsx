import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/auth.tsx'
import type { Role } from '../api/types'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'

export function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('CLIENT')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(role, email, password)
      }
    } catch (err: unknown) {
      const apiError = isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : null
      toast.error(apiError ?? 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-sc-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.15),transparent_35%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-md rounded-2xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Code2 size={14} className="text-white" />
                </div>
                <span className="text-sm font-display font-bold text-white">SkillChain</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-white">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm text-muted_text mt-1">Freelancing secured by code</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary-light">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="gradient-line mb-6" />

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted_text">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sc-input mt-1.5"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted_text">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="sc-input mt-1.5"
                placeholder="••••••••"
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-muted_text">I am a</label>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  {(['CLIENT', 'FREELANCER'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        role === r
                          ? 'border-primary bg-primary/10 text-primary-light'
                          : 'border-white/[0.08] bg-white/[0.03] text-muted_text hover:bg-white/[0.06]'
                      }`}
                    >
                      {r === 'CLIENT' ? '💼 Client' : '🚀 Freelancer'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={loading} glow>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <div className="text-center text-xs text-muted_text">
              {mode === 'login' ? 'New to SkillChain?' : 'Already registered?'}{' '}
              <button className="text-primary-light font-medium hover:text-white transition-colors" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Create an account' : 'Sign in'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
