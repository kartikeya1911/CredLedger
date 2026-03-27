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
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Transactions</h2>
          <p className="text-sm text-muted_text">UPI and on-chain events with full audit trail.</p>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent font-medium">
          <Wallet2 size={14} className="inline mr-2" />Bridge synced
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-muted_text text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 font-medium">Type</th>
                <th className="py-3 font-medium">Amount</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium">Chain</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-4">
                    <Skeleton className="h-4 w-40" />
                  </td>
                </tr>
              )}
              {!loading && txs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted_text">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {txs.map((tx) => (
                <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 capitalize">{tx.type.toLowerCase()}</td>
                  <td className="py-3.5 font-medium">{formatCurrency(tx.amountPaise)}</td>
                  <td className="py-3.5"><StatusPill status={tx.status} /></td>
                  <td className="py-3.5 text-xs text-muted_text font-mono">{tx.chain?.txHash?.slice(0, 10) ?? '—'}</td>
                  <td className="py-3.5 text-xs text-muted_text">{formatDate(tx.createdAt)}</td>
                  <td className="py-3.5 text-right">
                    <a
                      href={tx.chain?.txHash ? `https://sepolia.etherscan.io/tx/${tx.chain.txHash}` : '#'}
                      className="text-primary-light hover:text-secondary transition-colors text-xs font-medium"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View <ExternalLink size={12} className="inline" />
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
