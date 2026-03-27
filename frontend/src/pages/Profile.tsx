import { useState } from 'react'
import { Shield, Activity, BadgeCheck, Star, Briefcase, Wallet, Coins } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { TrustBadge } from '../components/TrustBadge'
import { useAuth } from '../context/auth.tsx'
import { useWallet } from '../context/wallet'
import { fetchDashboardStats, type DashboardStats } from '../api'
import { formatCurrency } from '../utils/format'
import { usePolling } from '../hooks/usePolling'
import { Skeleton } from '../components/Skeleton'

export function ProfilePage() {
  const { user } = useAuth()
  const { address } = useWallet()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await fetchDashboardStats()
    setStats(data)
    setLoading(false)
  }

  usePolling(refresh, 15000, true)

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'
  const profile = stats?.profile
  const trustScore = stats?.trustScore ?? 50

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Profile</h2>
          <p className="text-sm text-muted_text">Identity, reputation, and live stats.</p>
        </div>
        <TrustBadge score={trustScore} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-glow text-lg font-display font-bold">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="text-lg font-display font-semibold text-white">{user?.email || user?.phone || 'Account'}</div>
              <div className="text-xs text-muted_text">Role: <span className="text-primary-light font-medium">{user?.role}</span></div>
            </div>
          </div>
          <div className="mt-5 grid gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm">
              <div className="text-xs text-muted_text font-medium flex items-center gap-1.5 mb-1"><Wallet size={12} /> Wallet</div>
              <div className="text-white font-mono text-xs">{shortAddress}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm">
              <div className="text-xs text-muted_text font-medium mb-1">Trust Score</div>
              {loading ? <Skeleton className="h-5 w-16" /> : (
                <div className="font-medium" style={{
                  color: trustScore >= 75 ? '#22C55E' : trustScore >= 50 ? '#EAB308' : '#EF4444'
                }}>
                  {trustScore}/100
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm">
              <div className="text-xs text-muted_text font-medium flex items-center gap-1.5 mb-1"><Star size={12} /> Rating</div>
              {loading ? <Skeleton className="h-5 w-24" /> : (
                <div className="text-white">
                  {profile?.rating ? `${profile.rating.toFixed(1)} / 5.0` : 'No ratings yet'}
                  {profile?.reviewCount ? (
                    <span className="text-muted_text"> ({profile.reviewCount} reviews)</span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm">
              <div className="text-xs text-muted_text font-medium flex items-center gap-1.5 mb-1"><Briefcase size={12} /> Jobs</div>
              {loading ? <Skeleton className="h-5 w-20" /> : (
                <div className="text-white">
                  {profile?.jobsCompleted ?? 0} completed
                  <span className="text-muted_text"> / {profile?.totalJobs ?? 0} total</span>
                </div>
              )}
            </div>
          </div>
          {/* Earnings / Spending */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="text-xs text-muted_text font-medium flex items-center gap-1.5 mb-2">
              <Coins size={12} />
              {user?.role === 'FREELANCER' ? 'Total Earned' : 'Total Spent'}
            </div>
            {loading ? <Skeleton className="h-6 w-28" /> : (
              <div className="text-xl font-display font-bold text-accent">
                {formatCurrency(
                  user?.role === 'FREELANCER' ? (profile?.totalEarned ?? 0) : (profile?.totalSpent ?? 0)
                )}
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-display font-semibold text-white mb-4">Risk Signals</div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : stats?.signals && stats.signals.length > 0 ? (
            <div className="space-y-3 text-sm">
              {stats.signals.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {s.positive ? (
                    <BadgeCheck size={15} className="text-accent shrink-0" />
                  ) : (
                    <Shield size={15} className="text-amber-400 shrink-0" />
                  )}
                  <span className={s.positive ? 'text-slate-200' : 'text-amber-200'}>{s.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Activity size={15} className="text-muted_text" />
                Complete jobs and milestones to build your trust profile
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
