'use client'

import { PERIODS } from '@/lib/finance'

const input = 'bg-white text-sm px-2.5 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'

export default function PeriodFilter({ period, from, to, onChange }: {
  period: string; from: string; to: string
  onChange: (period: string, from: string, to: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <select className={input} value={period} onChange={e => onChange(e.target.value, from, to)} title="Período">
        {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      {period === 'custom' && (
        <>
          <input type="date" className={input} value={from} onChange={e => onChange('custom', e.target.value, to)} />
          <span className="text-[var(--muted)] text-sm">–</span>
          <input type="date" className={input} value={to} onChange={e => onChange('custom', from, e.target.value)} />
        </>
      )}
    </div>
  )
}
