import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wallet, ShieldCheck, UserRound, Layers } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/marketplace', label: 'Marketplace', icon: Briefcase },
  { to: '/transactions', label: 'Transactions', icon: Wallet },
  { to: '/trust', label: 'Trust & Risk', icon: ShieldCheck },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 flex-col rounded-3xl border border-white/5 bg-white/5 p-4 text-sm backdrop-blur lg:flex">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora to-cyber text-white shadow-glow">
          <Layers size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">CredLedger</div>
          <div className="text-[11px] text-slate-400">Escrow + Trust</div>
        </div>
      </div>
      <div className="space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/10 ${isActive ? 'bg-white/10 text-white' : 'text-slate-300'}`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
        <div className="font-semibold">Sepolia Status</div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Healthy · 12 validators
        </div>
      </div>
    </aside>
  )
}
