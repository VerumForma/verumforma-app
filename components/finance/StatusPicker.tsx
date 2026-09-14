'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Badge de estado clicável: abre um mini-menu para mudar só esse campo, direto na tabela.
// O menu é renderizado num portal (fixed) ancorado ao badge, por isso nunca é cortado
// pelo contentor da tabela, mesmo quando a lista é mais curta que o próprio menu.
export default function StatusPicker({ value, options, meta, canEdit, onChange, triggerLabel, triggerCls }: {
  value: string
  options: readonly string[]
  meta: Record<string, { label: string; cls: string }>
  canEdit: boolean
  onChange: (v: string) => void
  triggerLabel?: string
  triggerCls?: string
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const cur = meta[value]
  const cls = triggerCls ?? cur?.cls ?? ''
  const lbl = triggerLabel ?? cur?.label ?? value
  const badge = 'text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px]'

  const place = useCallback(() => {
    const t = triggerRef.current, m = menuRef.current
    if (!t || !m) return
    const r = t.getBoundingClientRect()
    const mw = m.offsetWidth, mh = m.offsetHeight
    const gap = 4, margin = 8
    const vw = window.innerWidth, vh = window.innerHeight
    let left = r.left
    left = Math.max(margin, Math.min(left, vw - mw - margin))
    let top = r.bottom + gap
    if (top + mh > vh - margin) {
      const topAbove = r.top - mh - gap
      top = topAbove >= margin ? topAbove : Math.max(margin, vh - mh - margin)
    }
    setPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    place()
    const on = () => place()
    window.addEventListener('scroll', on, true)
    window.addEventListener('resize', on)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', on, true)
      window.removeEventListener('resize', on)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, place])

  if (!canEdit) return <span className={`${badge} ${cls}`}>{lbl}</span>

  return (
    <div className="inline-block" onClick={e => e.stopPropagation()}>
      <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)} className={`${badge} ${cls} hover:ring-1 hover:ring-[var(--border)] cursor-pointer`} title="Mudar estado">{lbl}</button>
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={e => { e.stopPropagation(); setOpen(false) }} />
          <div ref={menuRef} onClick={e => e.stopPropagation()}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
            className="fixed z-[61] bg-white border border-[var(--border)] rounded-[4px] shadow-lg py-1 min-w-[9rem]">
            {options.map(o => (
              <button key={o} type="button" onClick={() => { setOpen(false); if (o !== value) onChange(o) }} className="flex items-center w-full text-left px-3 py-1.5 hover:bg-[rgba(26,26,26,0.04)]">
                <span className={`${badge} ${meta[o]?.cls ?? ''}`}>{meta[o]?.label ?? o}</span>
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
