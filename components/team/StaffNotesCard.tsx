'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StaffNotes } from '@/lib/supabase/types'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
const sticky = 'relative rounded-[10px] p-4 min-h-[110px] text-sm whitespace-pre-wrap bg-amber-50 border border-amber-200/70'
const ta = 'w-full bg-transparent text-sm outline-none resize-none min-h-[80px]'

export default function StaffNotesCard({ staffId, initial, canEdit }: { staffId: string; initial: StaffNotes[]; canEdit: boolean }) {
  const supabase = createClient()
  const [rows, setRows] = useState<StaffNotes[]>(initial)
  const [draftId, setDraftId] = useState<string | null>(null) // 'new' | note.id
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('staff_notes').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    setRows((data ?? []) as StaffNotes[])
  }
  function startNew() { setDraftId('new'); setText('') }
  function startEdit(n: StaffNotes) { setDraftId(n.id); setText(n.content) }
  function cancel() { setDraftId(null); setText('') }
  async function save() {
    if (!text.trim()) { cancel(); return }
    setSaving(true)
    if (draftId === 'new') await supabase.from('staff_notes').insert({ staff_id: staffId, content: text.trim() })
    else await supabase.from('staff_notes').update({ content: text.trim() }).eq('id', draftId!)
    setSaving(false); cancel(); refresh()
  }
  async function remove(id: string) { await supabase.from('staff_notes').delete().eq('id', id); refresh() }

  const editor = (isNew: boolean) => (
    <div className={sticky}>
      <textarea autoFocus className={ta} value={text} onChange={e => setText(e.target.value)} placeholder="Escreve a nota…" />
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={cancel} className="text-[var(--muted)] hover:text-[#1A1A1A]" aria-label="Cancelar"><X size={16} /></button>
        <button onClick={save} disabled={saving} className="text-green-700 hover:text-green-800 disabled:opacity-50" aria-label="Guardar"><Check size={16} /></button>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {draftId === 'new' && editor(true)}
      {rows.map(n => draftId === n.id ? (
        <div key={n.id}>{editor(false)}</div>
      ) : (
        <div key={n.id} className={`${sticky} group`}>
          <p>{n.content}</p>
          <p className="text-[11px] text-amber-800/60 mt-2">{fmt(n.created_at)}</p>
          {canEdit && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(n)} className="text-amber-800/70 hover:text-amber-900" aria-label="Editar"><Pencil size={14} /></button>
              <ConfirmButton onConfirm={() => remove(n.id)} message="Eliminar esta nota?" className="text-amber-800/70 hover:text-red-600" title="Eliminar"><Trash2 size={14} /></ConfirmButton>
            </div>
          )}
        </div>
      ))}
      {canEdit && draftId !== 'new' && (
        <button onClick={startNew} className="rounded-[10px] p-4 min-h-[110px] border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors inline-flex items-center justify-center gap-2 text-sm">
          <Plus size={16} /> Nova nota
        </button>
      )}
      {rows.length === 0 && draftId === null && !canEdit && <p className="text-sm text-[var(--muted)]">Sem notas.</p>}
    </div>
  )
}
