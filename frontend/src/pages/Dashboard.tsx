import { useEffect, useMemo, useState } from 'react'
import { Activity, Coins, TrendingUp, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatCard } from '../components/StatCard'
import { Card } from '../components/ui/Card'
import { Timeline, type TimelineItem } from '../components/Timeline'
import { Button } from '../components/ui/Button'
import { TrustBadge } from '../components/TrustBadge'
import { formatCurrency } from '../utils/format'
import { createJob, fetchJobs } from '../api'
import type { Job } from '../api/types'
import { usePolling } from '../hooks/usePolling'
import { Skeleton } from '../components/Skeleton'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/auth'

export function DashboardPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
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

  const refresh = async () => {
    try {
      const data = await fetchJobs()
      setJobs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  usePolling(refresh, 8000, true)

  const metrics = useMemo(() => {
    const active = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length
    const pendingMilestones = jobs.reduce((acc, j) => acc + (j.applications?.length ?? 0), 0)
    const total = jobs.reduce((acc, j) => acc + (j.budget?.totalAmountPaise ?? 0), 0)
    return { active, pendingMilestones, total }
  }, [jobs])

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Overview</p>
          <h1 className="text-2xl font-semibold text-white">CredLedger Command Center</h1>
          <p className="text-sm text-slate-400">Escrow, trust, and milestones in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Download report</Button>
          {user?.role === 'CLIENT' && <Button onClick={() => setShowNewJob(true)}>New Job</Button>}
        </div>
      </div>

      <div className="card-grid">
        <StatCard label="Total Volume" value={formatCurrency(metrics.total)} sub="Lifetime processed" icon={<Coins size={18} />} />
        <StatCard label="Active Jobs" value={metrics.active.toString()} sub="In-flight" icon={<Activity size={18} />} accent="from-cyber to-emerald-400" />
        <StatCard label="Pending Milestones" value={metrics.pendingMilestones.toString()} sub="Across all jobs" icon={<TrendingUp size={18} />} accent="from-amber-400 to-orange-400" />
        <StatCard label="Trust Score" value="82/100" sub="AI risk model" icon={<ShieldCheck size={18} />} accent="from-emerald-500 to-cyan-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Recent Activity</div>
              <div className="text-xs text-slate-400">Live updates every 8s</div>
            </div>
            <TrustBadge score={82} />
          </div>
          <div className="gradient-line my-4" />
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <Timeline items={activity} />
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">UPI → Chain Bridge</div>
              <div className="text-xs text-slate-400">Webhooks + on-chain receipts</div>
            </div>
            <span className="badge-success">Healthy</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
              <div>
                <div className="text-xs text-slate-400">Webhook latency</div>
                <div className="text-sm text-white">312 ms</div>
              </div>
              <span className="badge-success">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
              <div>
                <div className="text-xs text-slate-400">Chain confirmations</div>
                <div className="text-sm text-white">2/12</div>
              </div>
              <span className="badge-info">In flight</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
              <div>
                <div className="text-xs text-slate-400">Fraud alerts</div>
                <div className="text-sm text-white">0 open</div>
              </div>
              <span className="badge-success">Clear</span>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={showNewJob} onClose={() => setShowNewJob(false)} title="Create a new job">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Title</label>
            <input
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Description</label>
            <textarea
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Skills (comma separated)</label>
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Budget (paise)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-semibold uppercase text-slate-300">Milestone</div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400">Title</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Amount (paise)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs text-slate-400">Description</label>
              <textarea
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
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
                } catch (err: any) {
                  const message = err?.response?.data?.error ?? 'Failed to create job'
                  toast.error(message)
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
