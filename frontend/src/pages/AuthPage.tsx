import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/auth.tsx'
import type { Role } from '../api/types'
import toast from 'react-hot-toast'

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
        toast.success('Signed in')
      } else {
        await register(role, email, password)
        toast.success('Account created')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050915]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.18),transparent_25%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                <Shield size={14} /> CredLedger Escrow
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-white">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-slate-400">Secure freelance + rental escrow on Sepolia</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora to-cyber text-white shadow-glow">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="gradient-line my-6" />
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Email or phone</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-aurora"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-aurora"
                placeholder="••••••••"
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400">Role</label>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  {(['CLIENT', 'FREELANCER'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-2xl border px-3 py-2 ${role === r ? 'border-aurora bg-aurora/15 text-white' : 'border-white/10 bg-white/5 text-slate-300'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={loading} glow>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
            <div className="text-center text-xs text-slate-400">
              {mode === 'login' ? 'New to CredLedger?' : 'Already registered?'}{' '}
              <button className="text-aurora" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Create an account' : 'Go to login'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
