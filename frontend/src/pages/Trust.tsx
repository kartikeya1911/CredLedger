import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { TrustBadge } from '../components/TrustBadge'
import { Timeline, type TimelineItem } from '../components/Timeline'
import { fetchDashboardStats, type DashboardStats } from '../api'
import { usePolling } from '../hooks/usePolling'
import { Skeleton } from '../components/Skeleton'
import { CheckCircle2, AlertTriangle, ShieldCheck, TrendingUp, History } from 'lucide-react'

export function TrustPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await fetchDashboardStats()
    setStats(data)
    setLoading(false)
  }

  usePolling(refresh, 10000, true)

  const score = stats?.trustScore ?? 50
  const signals = stats?.signals ?? []
  const decisions: TimelineItem[] = (stats?.decisions ?? []).map((d) => ({
    title: d.title,
    description: d.description,
    status: d.status as 'success' | 'warning' | 'info',
    date: d.date,
  }))

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Trust & Risk</h2>
          <p className="text-sm text-muted_text">Real-time scoring from your on-chain activity.</p>
        </div>
        <TrustBadge score={score} />
      </div>

      {/* Score breakdown */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-400 text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-sm font-display font-semibold text-white">Trust Score Breakdown</div>
            <div className="text-xs text-muted_text">Computed from your real activity on SkillChain</div>
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${score}%`,
              background: score >= 75 ? 'linear-gradient(90deg, #22C55E, #06B6D4)' :
                          score >= 50 ? 'linear-gradient(90deg, #EAB308, #F59E0B)' :
                          'linear-gradient(90deg, #EF4444, #F97316)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted_text">
          <span>0 — High Risk</span>
          <span className="font-medium text-white">{score}/100</span>
          <span>100 — Trusted</span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary-light" />
            <div className="text-sm font-display font-semibold text-white">Trust Signals</div>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : signals.length === 0 ? (
            <p className="text-sm text-muted_text py-3 text-center">
              No activity yet — complete jobs and milestones to build your trust score.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {signals.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  {s.positive ? (
                    <CheckCircle2 size={15} className="text-accent shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                  )}
                  <span className={s.positive ? 'text-slate-200' : 'text-amber-200'}>{s.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <History size={16} className="text-secondary" />
            <div className="text-sm font-display font-semibold text-white">Recent Decisions</div>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : decisions.length === 0 ? (
            <p className="text-sm text-muted_text py-3 text-center">
              No milestone decisions yet. Fund and complete milestones to see activity here.
            </p>
          ) : (
            <Timeline items={decisions} />
          )}
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-2xl font-display font-bold text-white">
            {stats?.metrics.completedJobs ?? 0}
          </div>
          <div className="text-xs text-muted_text mt-1">Jobs Completed</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-2xl font-display font-bold text-white">
            {stats?.metrics.releasedMilestones ?? 0}
          </div>
          <div className="text-xs text-muted_text mt-1">Milestones Released</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-2xl font-display font-bold text-white">
            {stats?.metrics.disputedMilestones ?? 0}
          </div>
          <div className="text-xs text-muted_text mt-1">Disputes</div>
        </div>
      </div>
    </div>
  )
}
