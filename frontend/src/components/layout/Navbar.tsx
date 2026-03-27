import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/auth.tsx'
import { useWallet } from '../../context/wallet'
import { formatDate } from '../../utils/format'

export function Navbar() {
  const { user, logout } = useAuth()
  const { address, connect, connecting } = useWallet()
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between rounded-xl border border-white/[0.06] bg-sc-card/60 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3 text-sm text-muted_text">
        <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs text-accent font-medium">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Sepolia
        </div>
        <span className="hidden text-xs text-muted_text md:inline">{formatDate(new Date().toISOString())}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-muted_text md:flex">
          <Search size={14} />
          <input className="bg-transparent outline-none placeholder:text-slate-500 w-40" placeholder="Search..." />
        </div>
        <button className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-muted_text hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <button
          className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary-light hover:bg-primary/20 transition-all"
          onClick={() => void connect()}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : shortAddress ?? 'Connect Wallet'}
        </button>
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-center text-xs font-semibold leading-8 text-white">
              {user.email?.[0]?.toUpperCase() ?? user.phone?.[0] ?? 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-white">{user.email || user.phone}</div>
              <div className="text-[10px] text-muted_text">{user.role}</div>
            </div>
            <button className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
