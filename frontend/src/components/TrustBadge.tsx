import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react'

export function TrustBadge({ score }: { score: number }) {
  const level = score >= 80 ? 'SAFE' : score >= 50 ? 'MEDIUM' : 'RISKY'
  const tone = level === 'SAFE' ? 'badge-success' : level === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
  const Icon = level === 'SAFE' ? ShieldCheck : level === 'MEDIUM' ? AlertTriangle : Flame
  return (
    <span className={`pill ${tone}`}>
      <Icon size={14} /> {score} · {level}
    </span>
  )
}
