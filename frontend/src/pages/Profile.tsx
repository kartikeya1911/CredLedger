import { Shield, UserRound, Activity, BadgeCheck } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { TrustBadge } from '../components/TrustBadge'
import { useAuth } from '../context/auth'

export function ProfilePage() {
  const { user } = useAuth()
  const trust = 84
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Profile</h2>
          <p className="text-sm text-slate-400">Identity, trust, and history.</p>
        </div>
        <TrustBadge score={trust} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora to-cyber text-white shadow-glow">
              <UserRound size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{user?.email || user?.phone}</div>
              <div className="text-xs text-slate-400">Role: {user?.role}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="text-xs text-slate-400">Wallet</div>
              <div className="text-slate-200">0x1234...abcd</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="text-xs text-slate-400">KYC</div>
              <div className="text-slate-200">Verified</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white">Risk signals</div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" /> No fraud flags
            </div>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-300" /> UPI webhooks synced
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-aurora" /> Wallet ownership verified
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
