import { useEffect, useState } from 'react'
import { ExternalLink, Wallet2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { StatusPill } from '../components/StatusPill'
import { formatCurrency, formatDate } from '../utils/format'
import { fetchTransactions } from '../api'
import type { Transaction } from '../api/types'
import { usePolling } from '../hooks/usePolling'
import { Skeleton } from '../components/Skeleton'

export function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const data = await fetchTransactions()
      setTxs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  usePolling(refresh, 10000, true)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Transactions</h2>
          <p className="text-sm text-slate-400">UPI and on-chain events with audit trail.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          <Wallet2 size={14} className="inline mr-2" /> Bridge synced
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Type</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Chain</th>
                <th className="py-2">Date</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-4">
                    <Skeleton className="h-4 w-40" />
                  </td>
                </tr>
              )}
              {!loading && txs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-sm text-slate-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {txs.map((tx) => (
                <tr key={tx._id} className="">
                  <td className="py-3 capitalize">{tx.type.toLowerCase()}</td>
                  <td className="py-3">{formatCurrency(tx.amountPaise)}</td>
                  <td className="py-3"><StatusPill status={tx.status} /></td>
                  <td className="py-3 text-xs text-slate-400">{tx.chain?.txHash?.slice(0, 10) ?? '—'}</td>
                  <td className="py-3 text-xs text-slate-400">{formatDate(tx.createdAt)}</td>
                  <td className="py-3 text-right">
                    <a
                      href={tx.chain?.txHash ? `https://sepolia.etherscan.io/tx/${tx.chain.txHash}` : '#'}
                      className="text-aurora hover:text-cyber"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View <ExternalLink size={14} className="inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
