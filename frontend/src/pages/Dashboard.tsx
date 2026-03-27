import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Coins, TrendingUp, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import { StatCard } from '../components/StatCard'
import { Card } from '../components/ui/Card'
import { Timeline, type TimelineItem } from '../components/Timeline'
import { Button } from '../components/ui/Button'
import { TrustBadge } from '../components/TrustBadge'
import { formatCurrency } from '../utils/format'
import { createJob, fetchJobs, downloadJobReport, fetchDashboardStats, type DashboardStats } from '../api'
import type { Job } from '../api/types'
import { usePolling } from '../hooks/usePolling'
import { Skeleton } from '../components/Skeleton'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/auth.tsx'

export function DashboardPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewJob, setShowNewJob] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [budget, setBudget] = useState(50000)
  const [milestoneTitle, setMilestoneTitle] = useState('Initial milestone')
  const [milestoneAmount, setMilestoneAmount] = useState(50000)
  const [milestoneDescription, setMilestoneDescription] = useState('Deliver first module')

  const refresh = useCallback(async () => {
    try {
      const jobsData = await fetchJobs()
      setJobs(jobsData)
      // Only fetch protected stats when authenticated; avoids noisy 401s for guests.
      if (user) {
        const statsData = await fetchDashboardStats()
        setStats(statsData)
      } else {
        setStats(null)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  usePolling(refresh, 8000, true)

  const trustScore = stats?.trustScore ?? 50
  const bridge = stats?.bridge

  const activity: TimelineItem[] = useMemo(
    () =>
      jobs.slice(0, 5).map((j) => ({
        title: j.title,
        description: `${j.status} · ${j.skills?.slice(0, 3).join(', ') ?? 'General'}`,
        status: j.status === 'IN_PROGRESS' ? 'success' : j.status === 'OPEN' ? 'info' : 'warning',
        date: j.createdAt,
      })),
    [jobs],
  )

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted_text">Overview</p>
          <h1 className="text-2xl font-display font-bold text-white">SkillChain Dashboard</h1>
          <p className="text-sm text-muted_text">Escrow, trust, and milestones — all live.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              if (!jobs[0]?._id) {
                toast.error('No jobs to download yet')
                return
              }
              try {
                setLoading(true)
                const blob = await downloadJobReport(jobs[0]._id)
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `job-${jobs[0]._id}-report.json`
                a.click()
                window.URL.revokeObjectURL(url)
                toast.success('Report downloaded')
              } catch (err: unknown) {
                const apiError = isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : null
                toast.error(apiError ?? 'Failed to download report')
              } finally {
                setLoading(false)
              }
            }}
          >
            Download report
          </Button>
          {user?.role === 'CLIENT' && <Button onClick={() => setShowNewJob(true)}>New Job</Button>}
        </div>
      </div>

      <div className="card-grid">
        <StatCard
          label="Total Volume"
          value={formatCurrency(stats?.metrics.totalVolume ?? 0)}
          sub="Lifetime processed"
          icon={<Coins size={18} />}
        />
        <StatCard
          label="Active Jobs"
          value={String(stats?.metrics.activeJobs ?? 0)}
          sub={`${stats?.metrics.completedJobs ?? 0} completed`}
          icon={<Activity size={18} />}
          accent="from-secondary to-emerald-400"
        />
        <StatCard
          label="Pending Milestones"
          value={String(stats?.metrics.pendingMilestones ?? 0)}
          sub={`${stats?.metrics.releasedMilestones ?? 0} released`}
          icon={<TrendingUp size={18} />}
          accent="from-amber-400 to-orange-400"
        />
        <StatCard
          label="Trust Score"
          value={`${trustScore}/100`}
          sub="Live computation"
          icon={<ShieldCheck size={18} />}
          accent="from-emerald-500 to-cyan-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-display font-semibold text-white">Recent Activity</div>
              <div className="text-xs text-muted_text">Live updates every 8s</div>
            </div>
            <TrustBadge score={trustScore} />
          </div>
          <div className="gradient-line my-4" />
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted_text py-4 text-center">No jobs yet. Create your first job to get started!</p>
          ) : (
            <Timeline items={activity} />
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-display font-semibold text-white">Chain Bridge</div>
              <div className="text-xs text-muted_text">Blockchain + on-chain receipts</div>
            </div>
            <span className={bridge?.healthy ? 'badge-success' : 'badge-warning'}>
              {bridge?.healthy ? (
                <><Wifi size={12} /> Live</>
              ) : (
                <><WifiOff size={12} /> Idle</>
              )}
            </span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
              <div>
                <div className="text-xs text-muted_text">On-chain TXs</div>
                <div className="text-sm font-medium text-white">{bridge?.chainTxCount ?? 0}</div>
              </div>
              <span className={(bridge?.chainTxCount ?? 0) > 0 ? 'badge-success' : 'badge-info'}>
                {(bridge?.chainTxCount ?? 0) > 0 ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
              <div>
                <div className="text-xs text-muted_text">Total Transactions</div>
                <div className="text-sm font-medium text-white">{bridge?.totalTxCount ?? 0}</div>
              </div>
              <span className="badge-info">{(bridge?.totalTxCount ?? 0) > 0 ? 'Active' : 'None'}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
              <div>
                <div className="text-xs text-muted_text">Disputes / Fraud</div>
                <div className="text-sm font-medium text-white">{bridge?.fraudAlerts ?? 0} open</div>
              </div>
              <span className={(bridge?.fraudAlerts ?? 0) === 0 ? 'badge-success' : 'badge-danger'}>
                {(bridge?.fraudAlerts ?? 0) === 0 ? 'Clear' : 'Alert'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={showNewJob} onClose={() => setShowNewJob(false)} title="Create a new job">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted_text">Title</label>
            <input
              className="sc-input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted_text">Description</label>
            <textarea
              className="sc-input mt-1"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-muted_text">Skills (comma separated)</label>
              <input
                className="sc-input mt-1"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted_text">Budget (paise)</label>
              <input
                type="number"
                className="sc-input mt-1"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs font-semibold uppercase text-muted_text">Milestone</div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted_text">Title</label>
                <input
                  className="sc-input mt-1"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted_text">Amount (paise)</label>
                <input
                  type="number"
                  className="sc-input mt-1"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs text-muted_text">Description</label>
              <textarea
                className="sc-input mt-1"
                value={milestoneDescription}
                rows={2}
                onChange={(e) => setMilestoneDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewJob(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (user?.role !== 'CLIENT') {
                  toast.error('Only clients can create jobs')
                  return
                }
                try {
                  setCreating(true)
                  await createJob({
                    title,
                    description,
                    skills: skills
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    totalAmountPaise: budget,
                    milestones: [
                      {
                        title: milestoneTitle || title,
                        description: milestoneDescription,
                        amountPaise: milestoneAmount,
                      },
                    ],
                  })
                  toast.success('Job created')
                  setShowNewJob(false)
                  setTitle('')
                  setDescription('')
                  setSkills('')
                  setBudget(50000)
                  setMilestoneTitle('Initial milestone')
                  setMilestoneAmount(50000)
                  setMilestoneDescription('Deliver first module')
                  void refresh()
                } catch (err: unknown) {
                  if (isAxiosError<{ error?: string, details?: Array<{ path: string[], message: string }> }>(err) && err.response?.data?.details) {
                    const firstError = err.response.data.details[0]
                    toast.error(`${firstError.path.join('.') || 'Validation'}: ${firstError.message}`)
                  } else {
                    const message = isAxiosError<{ error?: string }>(err) ? (err.response?.data?.error ?? 'Failed to create job') : 'Failed to create job'
                    toast.error(message)
                  }
                } finally {
                  setCreating(false)
                }
              }}
              disabled={creating || !title || !description || milestoneAmount <= 0}
            >
              {creating ? 'Creating...' : 'Create job'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
