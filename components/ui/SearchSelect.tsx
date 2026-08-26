'use client'

import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

type Opt = { id: string; label: string }

export default function SearchSelect({ options, value, onChange, placeholder }: { options: Opt[]; value: string; onChange: (id: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = options.find(o => o.id === value)
  const filtered = q.trim() ? options.filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] flex items-center justify-between gap-2 text-left outline-none focus:border-[#1A1A1A]">
        <span className={selected ? 'truncate' : 'text-[var(--muted)]'}>{selected ? selected.label : (placeholder ?? 'Selecionar…')}</span>
        <ChevronDown size={15} className="text-[var(--muted)] shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ('') }} />
          <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-[var(--border)] rounded-[4px] shadow-lg">
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative"><Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-full text-sm pl-7 pr-2 py-1.5 outline-none" /></div>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && <p className="text-xs text-[var(--muted)] px-3 py-2">Sem resultados.</p>}
              {filtered.map(o => (
                <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); setQ('') }} className="flex items-center justify-between gap-2 w-full text-left text-sm px-3 py-2 hover:bg-[rgba(26,26,26,0.04)]">
                  <span className="truncate">{o.label}</span>{o.id === value && <Check size={15} className="shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
