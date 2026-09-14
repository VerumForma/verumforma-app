'use client'

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Botão de ação (ex. apagar) que abre um popover de confirmação ancorado a si próprio.
 * O popover fica centrado ligeiramente abaixo do botão e é sempre reposicionado para
 * caber no ecrã (encosta às margens, ou salta para cima se não houver espaço).
 */
export default function ConfirmButton({
  onConfirm,
  children,
  className,
  title,
  message = 'Tens a certeza?',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  stop = false,
}: {
  onConfirm: () => void
  children: ReactNode
  className?: string
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Impedir que o clique borbulhe (linhas de tabela clicáveis). */
  stop?: boolean
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; caret: number; above: boolean } | null>(null)

  const place = useCallback(() => {
    const t = triggerRef.current, p = popRef.current
    if (!t || !p) return
    const r = t.getBoundingClientRect()
    const pw = p.offsetWidth, ph = p.offsetHeight
    const m = 8
    const vw = window.innerWidth, vh = window.innerHeight
    let left = r.left + r.width / 2 - pw / 2
    left = Math.max(m, Math.min(left, vw - pw - m))
    let above = false
    let top = r.bottom + m
    if (top + ph > vh - m) {
      const topAbove = r.top - ph - m
      if (topAbove >= m) { top = topAbove; above = true }
      else top = Math.max(m, vh - ph - m)
    }
    const caret = Math.max(12, Math.min(r.left + r.width / 2 - left, pw - 12))
    setPos({ top, left, caret, above })
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

  return (
    <>
      <button ref={triggerRef} type="button" className={className} title={title}
        onClick={e => { if (stop) e.stopPropagation(); setOpen(o => !o) }}>
        {children}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={e => { if (stop) e.stopPropagation(); setOpen(false) }} />
          <div ref={popRef} onClick={e => e.stopPropagation()}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: 232, visibility: pos ? 'visible' : 'hidden' }}
            className="fixed z-[61] bg-white border border-[var(--border)] rounded-[6px] shadow-xl p-3">
            {pos && (
              <span className={`absolute w-2.5 h-2.5 bg-white border-[var(--border)] rotate-45 ${pos.above ? 'border-b border-r' : 'border-t border-l'}`}
                style={pos.above ? { left: pos.caret - 5, bottom: -5 } : { left: pos.caret - 5, top: -5 }} />
            )}
            <p className="text-sm mb-3 relative">{message}</p>
            <div className="flex justify-end gap-2 relative">
              <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">{cancelLabel}</button>
              <button type="button" onClick={() => { setOpen(false); onConfirm() }} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-[3px] hover:opacity-80">{confirmLabel}</button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
