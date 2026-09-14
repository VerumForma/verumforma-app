'use client'

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export type SortDir = 'asc' | 'desc'

// Cabeçalho de tabela ordenável. A-Z (asc) → seta para baixo; Z-A (desc) → seta para cima.
// Coluna inativa mostra uma seta dupla ténue (só em hover).
export default function SortHeader({
  label, active, dir, onClick, align = 'left', className = '',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right' | 'center'
  className?: string
}) {
  const alignTh = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  const alignBtn = align === 'right' ? 'flex-row-reverse' : align === 'center' ? 'justify-center' : ''
  return (
    <th className={`${alignTh} text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3 ${className}`}>
      <button type="button" onClick={onClick} className={`group inline-flex items-center gap-1 ${alignBtn} hover:text-[#1A1A1A] transition-colors ${active ? 'text-[#1A1A1A]' : ''}`}>
        <span>{label}</span>
        {active
          ? (dir === 'asc' ? <ChevronDown size={13} /> : <ChevronUp size={13} />)
          : <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />}
      </button>
    </th>
  )
}
