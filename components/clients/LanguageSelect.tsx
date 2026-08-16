'use client'

import { useState } from 'react'
import { X, Check, ChevronDown } from 'lucide-react'

const PRESET = ['Português', 'Espanhol', 'Inglês', 'Francês', 'Alemão']

export default function LanguageSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const toggle = (lang: string) =>
    onChange(value.includes(lang) ? value.filter(l => l !== lang) : [...value, lang])

  const addCustom = () => {
    const v = q.trim()
    if (v && !value.some(l => l.toLowerCase() === v.toLowerCase())) onChange([...value, v])
    setQ('')
  }

  const filtered = PRESET.filter(l => l.toLowerCase().includes(q.trim().toLowerCase()))
  const showAdd = !!q.trim()
    && !PRESET.some(l => l.toLowerCase() === q.trim().toLowerCase())
    && !value.some(l => l.toLowerCase() === q.trim().toLowerCase())

  return (
    <div className="relative">
      <div
        className="min-h-[38px] w-full bg-white border border-[var(--border)] rounded-[3px] px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text"
        onClick={() => setOpen(true)}
      >
        {value.map(l => (
          <span key={l} className="inline-flex items-center gap-1 text-xs bg-[rgba(26,26,26,0.06)] rounded-[3px] px-2 py-1">
            {l}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(l) }} className="text-[var(--muted)] hover:text-red-500"><X size={12} /></button>
          </span>
        ))}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' && showAdd) { e.preventDefault(); addCustom() } }}
          placeholder={value.length ? '' : 'Procurar ou adicionar…'}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent py-0.5"
        />
        <ChevronDown size={15} className="text-[var(--muted)] shrink-0" />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ('') }} />
          <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-[var(--border)] rounded-[4px] shadow-lg py-1 max-h-56 overflow-y-auto">
            {filtered.map(l => (
              <button key={l} type="button" onClick={() => toggle(l)} className="flex items-center justify-between w-full text-left text-sm px-3 py-2 hover:bg-[rgba(26,26,26,0.04)]">
                {l}
                {value.includes(l) && <Check size={15} />}
              </button>
            ))}
            {showAdd && (
              <button type="button" onClick={addCustom} className="w-full text-left text-sm px-3 py-2 hover:bg-[rgba(26,26,26,0.04)]">
                Adicionar “{q.trim()}”
              </button>
            )}
            {filtered.length === 0 && !showAdd && <p className="text-xs text-[var(--muted)] px-3 py-2">Sem resultados.</p>}
          </div>
        </>
      )}
    </div>
  )
}
