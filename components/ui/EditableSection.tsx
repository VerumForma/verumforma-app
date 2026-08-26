'use client'

import { useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'

type Ctx<T> = { editing: boolean; value: T; set: (patch: Partial<T>) => void }

// Bloco editável no sítio: mostra os dados, lápis para editar, Guardar/Cancelar.
export default function EditableSection<T extends Record<string, unknown>>({
  title, icon, canEdit, initial, onSave, className, children,
}: {
  title: string
  icon?: ReactNode
  canEdit: boolean
  initial: T
  onSave: (draft: T) => Promise<string | null> // devolve mensagem de erro ou null
  className?: string
  children: (ctx: Ctx<T>) => ReactNode
}) {
  const [saved, setSaved] = useState<T>(initial)
  const [draft, setDraft] = useState<T>(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const value = editing ? draft : saved
  const set = (patch: Partial<T>) => setDraft(d => ({ ...d, ...patch }))

  function start() { setDraft(saved); setError(''); setEditing(true) }
  function cancel() { setEditing(false); setError('') }
  async function save() {
    setSaving(true); setError('')
    const err = await onSave(draft)
    setSaving(false)
    if (err) { setError(err); return }
    setSaved(draft); setEditing(false)
  }

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-6 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] inline-flex items-center gap-2">{icon}{title}</p>
        {canEdit && !editing && <button onClick={start} className="text-[var(--muted)] hover:text-[#1A1A1A]" aria-label="Editar"><Pencil size={15} /></button>}
      </div>
      {children({ editing, value, set })}
      {editing && (
        <div className="flex items-center justify-end gap-3 mt-4">
          {error && <span className="text-xs text-red-500 mr-auto">{error}</span>}
          <button onClick={cancel} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
          <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
        </div>
      )}
    </div>
  )
}
