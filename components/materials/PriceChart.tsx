'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { eur } from '@/lib/materials'

type Pt = { date: string; price: number; supplier?: string | null }

export default function PriceChart({ points, suffix }: { points: Pt[]; suffix?: string }) {
  const suppliers = useMemo(() => Array.from(new Set(points.map(p => p.supplier || '—'))), [points])
  const [filter, setFilter] = useState<string>('all')
  const [hover, setHover] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(800)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setW(Math.max(320, Math.round(entries[0].contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const data = useMemo(() => {
    const f = filter === 'all' ? points : points.filter(p => (p.supplier || '—') === filter)
    return [...f].sort((a, b) => a.date.localeCompare(b.date))
  }, [points, filter])

  const chip = (a: boolean) => `text-xs px-2.5 py-1 rounded-full border ${a ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[#1A1A1A]'}`

  const H = 260, padL = 56, padR = 16, padT = 24, padB = 26
  const lbl = (n: number) => `${eur(n)}${suffix ?? ''}`

  let body: React.ReactNode = <p className="text-sm text-[var(--muted)]">Sem histórico de preços.</p>
  if (data.length > 0) {
    const xs = data.map((_, i) => data.length === 1 ? padL + (W - padL - padR) / 2 : padL + i * (W - padL - padR) / (data.length - 1))
    const prices = data.map(d => d.price)
    let min = Math.min(...prices), max = Math.max(...prices)
    if (min === max) { min = min * 0.95 || 0; max = max * 1.05 || 1 }
    const y = (p: number) => padT + (H - padT - padB) * (1 - (p - min) / (max - min))
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${y(d.price).toFixed(1)}`).join(' ')
    body = (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1={padL} y1={y(max)} x2={W - padR} y2={y(max)} stroke="rgba(26,26,26,0.12)" />
        <line x1={padL} y1={y(min)} x2={W - padR} y2={y(min)} stroke="rgba(26,26,26,0.12)" />
        <text x={6} y={y(max) + 4} fontSize="11" fill="rgba(26,26,26,0.5)">{lbl(max)}</text>
        <text x={6} y={y(min) + 4} fontSize="11" fill="rgba(26,26,26,0.5)">{lbl(min)}</text>
        <path d={line} fill="none" stroke="#1A1A1A" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <g key={i}>
            {hover === i && <circle cx={xs[i]} cy={y(d.price)} r="7" fill="none" stroke="#1A1A1A" strokeWidth="1.5" opacity="0.4" />}
            <circle cx={xs[i]} cy={y(d.price)} r={hover === i ? 4 : 3.5} fill="#1A1A1A" />
            <circle cx={xs[i]} cy={y(d.price)} r="14" fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(cur => cur === i ? null : cur)} />
          </g>
        ))}
        {hover !== null && data[hover] && (() => {
          const d = data[hover]; const cx = xs[hover]; const cy = y(d.price)
          const l1 = d.date
          const l2 = `${lbl(d.price)}${d.supplier ? ` · ${d.supplier}` : ''}`
          const w = Math.max(l1.length, l2.length) * 6.6 + 16
          const tx = Math.min(Math.max(cx - w / 2, 2), W - w - 2)
          const above = cy > padT + 40
          const ty = above ? cy - 44 : cy + 12
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={w} height="34" rx="6" fill="#1A1A1A" />
              <text x={tx + 8} y={ty + 14} fontSize="10.5" fill="rgba(255,255,255,0.7)">{l1}</text>
              <text x={tx + 8} y={ty + 27} fontSize="12" fontWeight="500" fill="#ffffff">{l2}</text>
            </g>
          )
        })()}
        <text x={padL} y={H - 6} fontSize="11" fill="rgba(26,26,26,0.5)">{data[0].date}</text>
        <text x={W - padR} y={H - 6} fontSize="11" fill="rgba(26,26,26,0.5)" textAnchor="end">{data[data.length - 1].date}</text>
      </svg>
    )
  }

  return (
    <div ref={wrapRef}>
      {suppliers.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-3">
          <button onClick={() => setFilter('all')} className={chip(filter === 'all')}>Todos</button>
          {suppliers.map(s => <button key={s} onClick={() => setFilter(s)} className={chip(filter === s)}>{s}</button>)}
        </div>
      )}
      {body}
    </div>
  )
}
