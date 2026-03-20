import { useEffect, useMemo, useState } from 'react'
import { api, setAuthToken } from './api'

type Role = 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'ARBITRATOR'

type User = { id: string; role: Role; email?: string; phone?: string }
type Job = {
  _id: string
  title: string
  description: string
  status: string
  clientId: string
  selectedFreelancerId?: string
  skills?: string[]
  applications?: any[]
}

type Milestone = {
  _id: string
  title: string
  status: string
  amountPaise: number
  index: number
  description?: string
}

const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`

function AuthPanel({ onAuthed }: { onAuthed: (u: User, token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('CLIENT')
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { emailOrPhone, password })
        onAuthed(res.data.user, res.data.accessToken)
      } else {
        await api.post('/auth/register', { role, email: emailOrPhone, password })
        const res = await api.post('/auth/login', { emailOrPhone, password })
        onAuthed(res.data.user, res.data.accessToken)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">{mode === 'login' ? 'Login' : 'Register'}</div>
        <button className="text-xs text-indigo-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          Switch to {mode === 'login' ? 'Register' : 'Login'}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-slate-700"
          placeholder="email or phone"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-slate-700"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === 'register' && (
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-slate-700"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="CLIENT">Client</option>
            <option value="FREELANCER">Freelancer</option>
          </select>
        )}
        {error && <div className="text-xs text-red-400">{error}</div>}
        <button
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
          onClick={submit}
        >
          {mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </div>
    </div>
  )
}

function CreateJob({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(50000)
  const [milestones, setMilestones] = useState([{ title: 'Milestone 1', amountPaise: 50000 }])
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    try {
      await api.post('/jobs', {
        title,
        description,
        milestones,
        totalAmountPaise: milestones.reduce((s, m) => s + m.amountPaise, 0) || amount,
      })
      setTitle('')
      setDescription('')
      onCreated()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-sm font-semibold text-slate-100">Post a Job</div>
      <div className="mt-3 space-y-3 text-sm">
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="space-y-2">
          <div className="text-xs text-slate-400">Milestones</div>
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-slate-700"
                value={m.title}
                onChange={(e) => {
                  const next = [...milestones]
                  next[idx].title = e.target.value
                  setMilestones(next)
                }}
              />
              <input
                type="number"
                className="w-32 rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-slate-700"
                value={m.amountPaise}
                onChange={(e) => {
                  const next = [...milestones]
                  next[idx].amountPaise = Number(e.target.value)
                  setMilestones(next)
                }}
              />
            </div>
          ))}
          <button
            className="text-xs text-indigo-300"
            onClick={() => setMilestones([...milestones, { title: `Milestone ${milestones.length + 1}`, amountPaise: 10000 }])}
          >
            + Add milestone
          </button>
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
        <button
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white"
          onClick={submit}
        >
          Create job
        </button>
      </div>
    </div>
  )
}

function JobCard({ job, onSelect, me }: { job: Job; onSelect: (id: string) => void; me?: User | null }) {
  const applications = job.applications ?? []
  const accepted = applications.find((a: any) => a.status === 'ACCEPTED')
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">{job.title}</div>
          <div className="text-xs text-slate-400">{job.status}</div>
        </div>
        <button className="text-xs text-indigo-300" onClick={() => onSelect(job._id)}>
          View
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-300 line-clamp-2">{job.description}</p>
      {accepted && (
        <div className="mt-2 text-xs text-emerald-300">Accepted: {String(accepted.freelancerId)}</div>
      )}
      {me?.role === 'CLIENT' && String(job.clientId) === me.id && (
        <div className="mt-2 text-xs text-slate-400">You are the client</div>
      )}
      {me?.role === 'FREELANCER' && job.selectedFreelancerId === me.id && (
        <div className="mt-2 text-xs text-emerald-300">You were accepted</div>
      )}
    </div>
  )
}

function JobDetail({ jobId, me, onClose }: { jobId: string; me?: User | null; onClose: () => void }) {
  const [job, setJob] = useState<Job | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [applyText, setApplyText] = useState('I can deliver this project')
  const [bid, setBid] = useState(50000)
  const [message, setMessage] = useState('Work submitted')

  const refresh = async () => {
    const res = await api.get(`/jobs/${jobId}`)
    setJob(res.data.job)
    setMilestones(res.data.milestones)
  }

  useEffect(() => {
    void refresh()
  }, [jobId])

  async function apply() {
    await api.post(`/jobs/${jobId}/apply`, { coverLetter: applyText, bidPaise: bid })
    await refresh()
  }

  async function accept(freelancerId: string) {
    await api.post(`/jobs/${jobId}/accept`, { freelancerId })
    await refresh()
  }

  async function milestoneAction(id: string, path: string, body?: any) {
    await api.post(`/milestones/${id}/${path}`, body ?? {})
    await refresh()
  }

  const applications = useMemo(() => job?.applications ?? [], [job])

  if (!job) return null
  const canApply = me?.role === 'FREELANCER' && job.status === 'OPEN'
  const isClient = me?.role === 'CLIENT' && me.id === String(job.clientId)

  return (
    <div className="fixed inset-0 z-20 bg-slate-950/80 px-4 py-10 backdrop-blur">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-100">{job.title}</div>
            <div className="text-xs text-slate-400">Status: {job.status}</div>
          </div>
          <button className="text-xs text-slate-300" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-200">{job.description}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-sm font-semibold text-slate-100">Milestones</div>
            <div className="mt-2 space-y-3 text-sm">
              {milestones.map((m) => (
                <div key={m._id} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-100">
                      {m.index + 1}. {m.title}
                    </div>
                    <div className="text-xs text-slate-400">{money(m.amountPaise)}</div>
                  </div>
                  <div className="text-xs text-slate-400">{m.status}</div>
                  {m.description && <p className="mt-1 text-xs text-slate-300">{m.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {isClient && (
                      <>
                        <button
                          className="rounded bg-amber-500/20 px-2 py-1 text-amber-300"
                          onClick={() => milestoneAction(m._id, 'deposit')}
                        >
                          Fund
                        </button>
                        <button
                          className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300"
                          onClick={() => milestoneAction(m._id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded bg-blue-500/20 px-2 py-1 text-blue-300"
                          onClick={() => milestoneAction(m._id, 'release')}
                        >
                          Release
                        </button>
                        <button
                          className="rounded bg-red-500/20 px-2 py-1 text-red-300"
                          onClick={() => milestoneAction(m._id, 'refund')}
                        >
                          Refund
                        </button>
                      </>
                    )}
                    {me?.role === 'FREELANCER' && me.id === job.selectedFreelancerId && (
                      <>
                        <button
                          className="rounded bg-indigo-500/20 px-2 py-1 text-indigo-300"
                          onClick={() => milestoneAction(m._id, 'submit', { message, submitHash: message })}
                        >
                          Submit
                        </button>
                        <button
                          className="rounded bg-rose-500/20 px-2 py-1 text-rose-300"
                          onClick={() => milestoneAction(m._id, 'dispute')}
                        >
                          Dispute
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-sm">
            {canApply && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm font-semibold text-slate-100">Apply</div>
                <textarea
                  className="mt-2 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700"
                  value={applyText}
                  onChange={(e) => setApplyText(e.target.value)}
                />
                <input
                  type="number"
                  className="mt-2 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700"
                  value={bid}
                  onChange={(e) => setBid(Number(e.target.value))}
                />
                <button
                  className="mt-2 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-2 font-semibold text-white"
                  onClick={apply}
                >
                  Submit application
                </button>
              </div>
            )}

            {isClient && applications.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm font-semibold text-slate-100">Applications</div>
                <div className="mt-2 space-y-2">
                  {applications.map((a: any) => (
                    <div key={String(a.freelancerId)} className="rounded border border-slate-800 p-2">
                      <div className="text-xs text-slate-300">{a.coverLetter}</div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>Bid: {money(a.bidPaise || 0)}</span>
                        <span>Status: {a.status}</span>
                      </div>
                      {job.status === 'OPEN' && (
                        <button
                          className="mt-2 rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300"
                          onClick={() => accept(String(a.freelancerId))}
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  async function loadMe() {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    setAuthToken(token)
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch (err) {
      setAuthToken(null)
    }
  }

  async function loadJobs() {
    const res = await api.get('/jobs')
    setJobs(res.data.items)
  }

  useEffect(() => {
    void loadMe()
    void loadJobs()
  }, [])

  function handleAuthed(u: User, token: string) {
    setAuthToken(token)
    setUser(u)
    void loadJobs()
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-100">Freelance Escrow</div>
              <div className="text-xs text-slate-400">UPI → Sepolia bridge</div>
            </div>
          </div>
          {user ? (
            <div className="text-xs text-slate-300">
              {user.email || user.phone} · {user.role}{' '}
              <button
                className="ml-2 text-rose-300"
                onClick={() => {
                  setAuthToken(null)
                  setUser(null)
                  setSelectedJobId(null)
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Not signed in</div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <section className="space-y-4 md:col-span-2">
            {user?.role === 'CLIENT' && <CreateJob onCreated={loadJobs} />}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-100">Jobs</div>
                <button className="text-xs text-slate-400" onClick={loadJobs}>
                  Refresh
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job._id} job={job} me={user} onSelect={(id) => setSelectedJobId(id)} />
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            {!user && <AuthPanel onAuthed={handleAuthed} />}
            {user && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
                <div className="text-sm font-semibold text-slate-100">Session</div>
                <div className="mt-2 text-slate-300">Role: {user.role}</div>
                <div className="text-slate-300">ID: {user.id}</div>
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
              <div className="text-sm font-semibold text-slate-100">Flow</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                <li>Client registers and posts a job.</li>
                <li>Freelancer applies and client accepts.</li>
                <li>Client funds milestone (simulated UPI → chain).</li>
                <li>Freelancer submits; client approves; release funds.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {selectedJobId && (
        <JobDetail jobId={selectedJobId} me={user} onClose={() => setSelectedJobId(null)} />
      )}
    </div>
  )
}

export default App
