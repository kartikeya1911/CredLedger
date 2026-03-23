import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { StatusPill } from '../components/StatusPill'
import { formatCurrency } from '../utils/format'
import { fetchEscrow } from '../api'
import type { Job, Milestone, Transaction } from '../api/types'
import { Timeline, type TimelineItem } from '../components/Timeline'
import toast from 'react-hot-toast'

export function EscrowPage() {
  const { address } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!address) return
      try {
        const res = await fetchEscrow(address)
        setJob(res.job)
        setMilestones(res.milestones)
        setTransactions(res.transactions)
      } catch (err: any) {
        toast.error(err?.response?.data?.error ?? 'Escrow not found')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [address])

  if (loading) return <div className="text-slate-400">Loading escrow...</div>
  if (!job) return <div className="text-slate-400">Escrow not found.</div>

  const timeline: TimelineItem[] = transactions.map((t) => ({
    title: `${t.type} · ${formatCurrency(t.amountPaise)}`,
    description: t.chain?.txHash ? `Tx: ${t.chain.txHash.slice(0, 10)}…` : t.status,
    status: t.status === 'SUCCESS' ? 'success' : t.status === 'PENDING' ? 'info' : 'warning',
    date: t.createdAt,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-wide text-slate-400">Escrow</div>
          <h2 className="text-2xl font-semibold text-white">{address}</h2>
          <p className="text-sm text-slate-400">{job.title}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Status: <StatusPill status={job.status} />
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Milestones</div>
            <div className="text-xs text-slate-400">On-chain + off-chain status</div>
          </div>
          <div className="text-xs text-slate-400">{milestones.length} items</div>
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
              <div className="mt-2 text-xs text-slate-400">
                {m.chain?.escrowAddress && <div>Escrow: {m.chain.escrowAddress}</div>}
                {m.chain?.lastTxHash && <div>Last tx: {m.chain.lastTxHash.slice(0, 12)}…</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Transactions</div>
            <div className="text-xs text-slate-400">Chain + UPI</div>
          </div>
          <div className="text-xs text-slate-400">{transactions.length} records</div>
        </div>
        <div className="mt-4">
          <Timeline items={timeline} />
        </div>
      </Card>
    </div>
  )
}
