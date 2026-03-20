import { Card } from '../components/ui/Card'
import { TrustBadge } from '../components/TrustBadge'
import { Timeline } from '../components/Timeline'

export function TrustPage() {
  const score = 82
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Trust & Risk</h2>
          <p className="text-sm text-slate-400">AI-powered scoring + fraud indicators.</p>
        </div>
        <TrustBadge score={score} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold text-white">Signals</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>+ On-time releases</li>
            <li>+ Verified wallet + KYC</li>
            <li>- New device login this week</li>
          </ul>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white">Recent decisions</div>
          <Timeline
            items={[
              { title: 'Risk check passed', description: 'Milestone release authorized', status: 'success' },
              { title: 'Dispute flagged', description: 'Admin reviewing evidence', status: 'warning' },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
