'use client'

import type { ReactNode } from 'react'

export type SummaryItem = { label: string; value: ReactNode; accent?: 'default' | 'green' | 'red' | 'amber' }

const accentCls: Record<string, string> = {
  default: 'text-[#1A1A1A]', green: 'text-green-700', red: 'text-red-600', amber: 'text-amber-600',
}

export default function SummaryBar({ items }: { items: SummaryItem[] }) {
  return (
    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--border)] border border-[var(--border)] rounded-[4px] overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className="bg-[var(--surface)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">{it.label}</p>
          <p className={`text-sm font-semibold ${accentCls[it.accent ?? 'default']}`}>{it.value}</p>
        </div>
      ))}
    </div>
  )
}
