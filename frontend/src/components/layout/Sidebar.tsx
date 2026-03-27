import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wallet, ShieldCheck, UserRound, Code2 } from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/marketplace', label: 'Jobs', icon: Briefcase },
  { to: '/dashboard/transactions', label: 'Transactions', icon: Wallet },
  { to: '/dashboard/trust', label: 'Trust & Risk', icon: ShieldCheck },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
]

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 flex-col rounded-2xl bg-sc-card/60 border border-white/[0.06] p-4 text-sm backdrop-blur lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-glow">
          <Code2 size={16} />
        </div>
        <div>
          <div className="text-sm font-display font-bold text-white">SkillChain</div>
          <div className="text-[10px] text-muted_text font-medium uppercase tracking-wider">Escrow Platform</div>
        </div>
      </div>
      <div className="space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary-light font-medium'
                  : 'text-muted_text hover:bg-white/[0.04] hover:text-white'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-auto rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-accent">
        <div className="font-semibold flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Sepolia Network
        </div>
        <div className="mt-1 text-[11px] text-muted_text">Chain: Healthy · Live</div>
      </div>
    </aside>
  )
}
