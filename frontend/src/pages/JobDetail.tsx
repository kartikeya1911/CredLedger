import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle2, Coins, ExternalLink, ShieldAlert } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/StatusPill'
import { TrustBadge } from '../components/TrustBadge'
import { formatCurrency } from '../utils/format'
import { applyToJob, acceptFreelancer, fetchJob, milestoneAction } from '../api'
import type { Job, Milestone } from '../api/types'
import { useAuth } from '../context/auth'
import toast from 'react-hot-toast'

export function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [coverLetter, setCoverLetter] = useState('Ready to ship secure escrow smart contracts.')
  const [bid, setBid] = useState(50000)
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    if (!id) return
    const data = await fetchJob(id)
    setJob(data.job)
    setMilestones(data.milestones)
  }

  useEffect(() => {
    void refresh()
  }, [id])

  const isClient = user && job && user.id === job.clientId

  async function apply() {
    if (!id) return
    setSubmitting(true)
    try {
      await applyToJob(id, coverLetter, bid)
      toast.success('Application sent')
      await refresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function accept(freelancerId: string) {
    if (!id) return
    await acceptFreelancer(id, freelancerId)
    toast.success('Freelancer accepted')
    await refresh()
  }

  async function doAction(milestoneId: string, action: string, body?: any) {
    await milestoneAction(milestoneId, action, body)
    toast.success(`${action} sent`)
    await refresh()
  }

  if (!job) {
    return (
      <div className="text-slate-400">Loading job...</div>
    )
  }

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-2 text-sm text-slate-400" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{job.title}</h2>
          <p className="text-sm text-slate-400">{job.description}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <StatusPill status={job.status} />
            <TrustBadge score={80} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            Budget {formatCurrency(job.budget?.totalAmountPaise)}
          </div>
          <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>
            View escrow
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Milestones</div>
              <div className="text-xs text-slate-400">Fund → Submit → Approve → Release</div>
            </div>
            <span className="badge-info">Live</span>
          </div>
          <div className="mt-4 space-y-3">
            {milestones.map((m) => (
              <div key={m._id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{m.index + 1}. {m.title}</div>
                    <div className="text-xs text-slate-400">{m.description}</div>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    {formatCurrency(m.amountPaise)}
                    <div className="mt-1">
                      <StatusPill status={m.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {isClient && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => doAction(m._id, 'deposit')} icon={<Coins size={14} />}>
                        Fund
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => doAction(m._id, 'approve')} icon={<CheckCircle2 size={14} />}>
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => doAction(m._id, 'release')}>
                        Release
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => doAction(m._id, 'refund')}>
                        Refund
                      </Button>
                    </>
                  )}
                  {user?.role === 'FREELANCER' && (
                    <>
                      <Button size="sm" variant="primary" icon={<Send size={14} />} onClick={() => doAction(m._id, 'submit', { message: 'Work delivered', submitHash: 'ipfs://hash' })}>
                        Submit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => doAction(m._id, 'dispute')}>
                        Dispute
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Applications</div>
              <div className="text-xs text-slate-400">Review bids and accept</div>
            </div>
            <span className="badge-info">{job.applications?.length ?? 0} bids</span>
          </div>
          <div className="mt-4 space-y-3">
            {(job.applications ?? []).map((app) => (
              <div key={String(app.freelancerId)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{String(app.freelancerId)}</div>
                  <StatusPill status={app.status} />
                </div>
                <div className="text-xs text-slate-400">Bid: {formatCurrency(app.bidPaise)}</div>
                <div className="mt-2 text-xs text-slate-300 line-clamp-2">{app.coverLetter}</div>
                {isClient && job.status === 'OPEN' && (
                  <Button className="mt-2 w-full" size="sm" onClick={() => accept(String(app.freelancerId))}>
                    Accept freelancer
                  </Button>
                )}
              </div>
            ))}
            {job.applications?.length === 0 && <div className="text-xs text-slate-500">No applications yet.</div>}
          </div>
        </Card>
      </div>

      {user?.role === 'FREELANCER' && job.status === 'OPEN' && (
        <Card hover={false}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Submit your proposal</div>
              <div className="text-xs text-slate-400">Share context for the client</div>
            </div>
            <TrustBadge score={76} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                rows={4}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Bid (paise)</label>
                <input
                  type="number"
                  value={bid}
                  onChange={(e) => setBid(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-aurora"
                />
              </div>
              <Button className="w-full" onClick={apply} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send proposal'}
              </Button>
              <div className="text-xs text-amber-300 flex items-center gap-2">
                <ShieldAlert size={14} /> Trusted payouts via escrow
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
