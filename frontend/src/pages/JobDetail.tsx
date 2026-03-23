import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle2, Coins, ExternalLink } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/StatusPill'
import { TrustBadge } from '../components/TrustBadge'
import { formatCurrency } from '../utils/format'
import { applyToJob, acceptFreelancer, createJobEscrow, fetchJob, milestoneAction } from '../api'
import type { Job, Milestone } from '../api/types'
import { useAuth } from '../context/auth.tsx'
import { useWallet } from '../context/wallet'
import { useContract } from '../hooks/useContract'
import { Interface } from 'ethers'
import { escrowFactoryAbi } from '../abi/escrowFactory'
import toast from 'react-hot-toast'

export function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ensureConnected, connecting, address } = useWallet()
  const { getEscrowContract, getFactoryContract } = useContract()
  const [job, setJob] = useState<Job | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [coverLetter, setCoverLetter] = useState('Ready to ship secure escrow smart contracts.')
  const [bid, setBid] = useState(50000)
  const [submitting, setSubmitting] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [creatingEscrow, setCreatingEscrow] = useState(false)
  const [clientAddress, setClientAddress] = useState('')
  const [freelancerAddress, setFreelancerAddress] = useState('')
  const [arbitratorAddress, setArbitratorAddress] = useState('')
  const [disputeModuleAddress, setDisputeModuleAddress] = useState('')

  const refresh = async () => {
    if (!id) return
    const data = await fetchJob(id)
    setJob(data.job)
    setMilestones(data.milestones)
  }

  useEffect(() => {
    void refresh()
  }, [id])

  useEffect(() => {
    if (address) {
      setClientAddress(address)
      setFreelancerAddress(address)
      setArbitratorAddress(address)
      setDisputeModuleAddress(address)
    }
  }, [address])

  const isClient = user && job && user.id === job.clientId

  const milestoneGuards = useMemo(
    () =>
      milestones.reduce<Record<string, { canSubmit: boolean; canApprove: boolean; canRelease: boolean; canRefund: boolean }>>((acc, m) => {
        acc[m._id] = {
          canSubmit: m.status === 'FUNDED',
          canApprove: m.status === 'SUBMITTED',
          canRelease: m.status === 'APPROVED',
          canRefund: ['FUNDED', 'DISPUTED', 'APPROVED'].includes(m.status),
        }
        return acc
      }, {}),
    [milestones],
  )

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

  async function createEscrowOnChain() {
    if (!job || !id) return
    if (!job.selectedFreelancerId) {
      toast.error('Select a freelancer first')
      return
    }
    try {
      setCreatingEscrow(true)
      setTxMessage('Waiting for wallet confirmation...')
      const addr = await ensureConnected()
      if (!addr) {
        setTxMessage(null)
        return
      }
      const factory = await getFactoryContract()
      const amounts = milestones.map((m) => BigInt(m.amountPaise))
      const tx = await factory.createEscrow(
        clientAddress || addr,
        freelancerAddress || addr,
        arbitratorAddress || addr,
        disputeModuleAddress || addr,
        amounts,
      )
      setTxMessage('Transaction submitted. Waiting for confirmations...')
      const receipt = await tx.wait()
      const iface = new Interface(escrowFactoryAbi)
      const parsed = receipt.logs
        .map((log: any) => {
          try {
            return iface.parseLog(log)
          } catch (_) {
            return null
          }
        })
        .find((p: any) => p && p.name === 'EscrowCreated')
      const escrowAddress = parsed?.args?.escrow ?? parsed?.args?.[0]
      if (!escrowAddress) throw new Error('Escrow address not found in logs')
      const network = await factory.runner?.provider?.getNetwork()
      await createJobEscrow(id, { contractAddress: escrowAddress, txHash: tx.hash, chainId: Number(network?.chainId ?? 0) })
      toast.success('Escrow created and saved')
      setTxMessage('Escrow created and saved')
      await refresh()
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.shortMessage ?? err?.message ?? 'Failed'
      if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected in wallet')
      } else {
        toast.error(message)
      }
      setTxMessage(null)
    } finally {
      setCreatingEscrow(false)
    }
  }

  async function doAction(milestoneId: string, action: string, body?: any) {
    const needsWallet = ['deposit', 'release', 'refund', 'dispute'].includes(action)
    try {
      let txHash: string | null = null
      let chainId: number | null = null
      const milestone = milestones.find((m) => m._id === milestoneId)
      if (!milestone) {
        toast.error('Milestone not found')
        return
      }
      const guards = milestoneGuards[milestoneId]
      if (action === 'submit' && !guards?.canSubmit) {
        toast.error('Submit is only available after funding')
        return
      }
      if (action === 'approve' && !guards?.canApprove) {
        toast.error('Submit work first before approval')
        return
      }
      if (action === 'release' && !guards?.canRelease) {
        toast.error('Release is only available after approval')
        return
      }
      if (needsWallet) {
        if (!job?.escrow?.contractAddress) {
          toast.error('Escrow not created yet')
          return
        }
        setTxMessage('Waiting for wallet confirmation...')
        const addr = await ensureConnected()
        if (!addr) {
          setTxMessage(null)
          return
        }
        const contract = await getEscrowContract(job.escrow.contractAddress)

        const valueWei = BigInt(milestone.amountPaise)
        let tx: any

        if (action === 'deposit') {
          tx = await contract.depositToMilestone(milestone.index, { value: valueWei })
        } else if (action === 'release') {
          tx = await contract.releaseToFreelancer(milestone.index)
        } else if (action === 'refund') {
          tx = await contract.refundClient(milestone.index)
        } else if (action === 'dispute') {
          tx = await contract.openDispute(milestone.index)
        } else {
          throw new Error('Unsupported action')
        }

        setTxMessage('Transaction submitted. Waiting for confirmations...')
        const receipt = await tx.wait()
        txHash = tx.hash
        const network = await contract.runner?.provider?.getNetwork()
        chainId = Number(network?.chainId ?? 0)
        const confirmations = receipt?.confirmations ?? 0
        setTxMessage(`Confirmations: ${confirmations}`)
      }

      await milestoneAction(milestoneId, action, {
        ...body,
        txHash,
        chainId,
        contractAddress: job?.escrow?.contractAddress,
        fromAddress: address,
      })
      toast.success(`${action} sent`)
      setTxMessage(needsWallet ? 'Transaction confirmed' : null)
      await refresh()
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.shortMessage ?? err?.message ?? 'Failed'
      if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected in wallet')
      } else {
        toast.error(message)
      }
      setTxMessage(null)
    }
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
          <Button
            size="sm"
            variant="secondary"
            icon={<ExternalLink size={14} />}
            onClick={() => {
              if (job.escrow?.contractAddress) {
                navigate(`/escrow/${job.escrow.contractAddress}`)
              } else {
                toast.error('Escrow not created yet')
              }
            }}
          >
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
          {!job.escrow?.contractAddress && isClient && (
            <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-900/30 px-3 py-2 text-xs text-amber-200 flex flex-col gap-2">
              <div className="font-semibold">Escrow not created</div>
              <div>Deploy escrow on Sepolia via MetaMask. Addresses default to your wallet; override if needed.</div>
              <div className="grid gap-2 md:grid-cols-2">
                <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="rounded-lg bg-white/5 px-2 py-1 text-white text-xs" placeholder="Client address" />
                <input value={freelancerAddress} onChange={(e) => setFreelancerAddress(e.target.value)} className="rounded-lg bg-white/5 px-2 py-1 text-white text-xs" placeholder="Freelancer address" />
                <input value={arbitratorAddress} onChange={(e) => setArbitratorAddress(e.target.value)} className="rounded-lg bg-white/5 px-2 py-1 text-white text-xs" placeholder="Arbitrator address" />
                <input value={disputeModuleAddress} onChange={(e) => setDisputeModuleAddress(e.target.value)} className="rounded-lg bg-white/5 px-2 py-1 text-white text-xs" placeholder="Dispute module address" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={createEscrowOnChain} disabled={creatingEscrow || connecting}>
                  {creatingEscrow ? 'Creating escrow...' : 'Create Escrow (MetaMask)'}
                </Button>
                <span className="text-amber-200/80">Flow: Create escrow → Fund → Submit → Approve → Release</span>
              </div>
            </div>
          )}
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => doAction(m._id, 'deposit')}
                        icon={<Coins size={14} />}
                        disabled={connecting || m.status !== 'AWAITING_FUNDING'}
                        title={m.status !== 'AWAITING_FUNDING' ? 'Must be awaiting funding' : ''}
                      >
                        {connecting ? 'Connect wallet' : 'Fund'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => doAction(m._id, 'approve')}
                        icon={<CheckCircle2 size={14} />}
                        disabled={!milestoneGuards[m._id]?.canApprove}
                        title={!milestoneGuards[m._id]?.canApprove ? 'Submit work first before approval' : ''}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => doAction(m._id, 'release')}
                        disabled={connecting || !milestoneGuards[m._id]?.canRelease}
                        title={!milestoneGuards[m._id]?.canRelease ? 'Approve before release' : ''}
                      >
                        {connecting ? 'Connect wallet' : 'Release'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => doAction(m._id, 'refund')}
                        disabled={connecting || !milestoneGuards[m._id]?.canRefund}
                        title={!milestoneGuards[m._id]?.canRefund ? 'Refund only after funding/approval/dispute' : ''}
                      >
                        {connecting ? 'Connect wallet' : 'Refund'}
                      </Button>
                    </>
                  )}
                  {user?.role === 'FREELANCER' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Send size={14} />}
                        onClick={() => doAction(m._id, 'submit', { message: 'Work delivered', submitHash: 'ipfs://hash' })}
                        disabled={!milestoneGuards[m._id]?.canSubmit}
                        title={!milestoneGuards[m._id]?.canSubmit ? 'Fund milestone before submitting' : ''}
                      >
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

      {txMessage && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          {txMessage}
        </div>
      )}

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
