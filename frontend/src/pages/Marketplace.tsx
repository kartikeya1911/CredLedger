import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TrustBadge } from '../components/TrustBadge'
import { StatusPill } from '../components/StatusPill'
import { formatCurrency } from '../utils/format'
import { fetchJobs } from '../api'
import type { Job } from '../api/types'
import { usePolling } from '../hooks/usePolling'

export function MarketplacePage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('')

  const refresh = async () => {
    const data = await fetchJobs()
    setJobs(data)
  }

  useEffect(() => {
    void refresh()
  }, [])

  usePolling(refresh, 10000, true)

  const filtered = useMemo(() => {
    return jobs.filter((j) => j.title.toLowerCase().includes(query.toLowerCase()) || j.description.toLowerCase().includes(query.toLowerCase()))
  }, [jobs, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Job Marketplace</h2>
          <p className="text-sm text-slate-400">Bid, apply, and accept with trust signals.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-sm text-white outline-none"
              placeholder="Search jobs"
            />
          </div>
          <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((job) => (
          <Card key={job._id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{job.title}</div>
                <div className="text-xs text-slate-400">Budget · {formatCurrency(job.budget?.totalAmountPaise)}</div>
              </div>
              <StatusPill status={job.status} />
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-slate-300">{job.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              {(job.skills ?? ['Blockchain', 'Payments']).map((s) => (
                <span key={s} className="rounded-full border border-white/10 px-2 py-1">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <TrustBadge score={78} />
              <Button size="sm" variant="secondary" className="px-3" onClick={() => navigate(`/jobs/${job._id}`)}>
                Apply <ArrowRight size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
