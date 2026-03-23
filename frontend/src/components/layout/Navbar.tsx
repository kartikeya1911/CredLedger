import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/auth.tsx'
import { useWallet } from '../../context/wallet'
import { formatDate } from '../../utils/format'

export function Navbar() {
  const { user, logout } = useAuth()
  const { address, connect, connecting } = useWallet()
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between rounded-2.5xl border border-white/5 bg-white/5 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live on Sepolia
        </div>
        <span className="hidden text-xs text-slate-500 md:inline">{formatDate(new Date().toISOString())}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 md:flex">
          <Search size={16} />
          <input className="bg-transparent outline-none placeholder:text-slate-500" placeholder="Search jobs, tx, users" />
        </div>
        <button className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:text-white">
          <Bell size={18} />
        </button>
        <button
          className="rounded-full border border-white/10 bg-aurora/10 px-3 py-1.5 text-xs font-semibold text-aurora hover:bg-aurora/20"
          onClick={() => void connect()}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : shortAddress ?? 'Connect wallet'}
        </button>
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-aurora to-cyber text-center text-xs font-semibold leading-8 text-white">
              {user.email?.[0]?.toUpperCase() ?? user.phone?.[0] ?? 'U'}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{user.email || user.phone}</div>
              <div className="text-[11px] text-slate-400">{user.role}</div>
            </div>
            <button className="text-[11px] text-rose-300" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
