'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StaffCertification } from '@/lib/supabase/types'
import { Plus, Pencil, Trash2, AlertTriangle, Award } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Draft = Partial<StaffCertification>

function expiryInfo(d: string | null) {
  if (!d) return null
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0) return { cls: 'bg-red-100 text-red-700', text: 'Expirada' }
  if (days <= 30) return { cls: 'bg-amber-100 text-amber-800', text: `Expira em ${days}d` }
  return { cls: 'bg-green-100 text-green-800', text: 'Válida' }
}
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function StaffCertifications({ staffId, initial, canEdit }: { staffId: string; initial: StaffCertification[]; canEdit: boolean }) {
  const supabase = createClient()
  const [rows, setRows] = useState<StaffCertification[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('staff_certifications').select('*').eq('staff_id', staffId).order('expiry_date', { nullsFirst: false })
    setRows((data ?? []) as StaffCertification[])
  }
  async function save() {
    if (!draft?.name?.trim()) return
    setSaving(true)
    const base = { name: draft.name!.trim(), issuer: draft.issuer || null, issue_date: draft.issue_date || null, expiry_date: draft.expiry_date || null, number: draft.number || null }
    const { error } = draft.id
      ? await supabase.from('staff_certifications').update(base).eq('id', draft.id)
      : await supabase.from('staff_certifications').insert({ ...base, staff_id: staffId })
    setSaving(false)
    if (!error) { setDraft(null); refresh() }
  }
  async function remove(id: string) { await supabase.from('staff_certifications').delete().eq('id', id); refresh() }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] inline-flex items-center gap-2"><Award size={15} /> Certificações e formações</p>
        {canEdit && !draft && <button onClick={() => setDraft({ name: '' })} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Adicionar</button>}
      </div>

      {draft && (
        <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="ex. Formação HST" /></div>
            <div><label className={label}>Entidade</label><input className={input} value={draft.issuer ?? ''} onChange={e => setDraft({ ...draft, issuer: e.target.value })} /></div>
            <div><label className={label}>Emissão</label><input type="date" className={input} value={draft.issue_date ?? ''} onChange={e => setDraft({ ...draft, issue_date: e.target.value || null })} /></div>
            <div><label className={label}>Validade</label><input type="date" className={input} value={draft.expiry_date ?? ''} onChange={e => setDraft({ ...draft, expiry_date: e.target.value || null })} /></div>
            <div><label className={label}>Número</label><input className={input} value={draft.number ?? ''} onChange={e => setDraft({ ...draft, number: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDraft(null)} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
            <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {rows.length === 0 && !draft && <p className="text-sm text-[var(--muted)]">Sem certificações registadas.</p>}
      <div className="divide-y divide-[var(--border)]">
        {rows.map(c => {
          const e = expiryInfo(c.expiry_date)
          return (
            <div key={c.id} className="flex items-center gap-4 py-3 first:pt-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}{c.number && <span className="text-[var(--muted)] font-normal"> · {c.number}</span>}</p>
                <p className="text-xs text-[var(--muted)]">{[c.issuer, c.issue_date && `Emitida ${fmt(c.issue_date)}`, c.expiry_date && `Válida até ${fmt(c.expiry_date)}`].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              {e && <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] inline-flex items-center gap-1 ${e.cls}`}>{e.text !== 'Válida' && <AlertTriangle size={11} />}{e.text}</span>}
              {canEdit && <div className="shrink-0 whitespace-nowrap">
                <button onClick={() => setDraft(c)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                <ConfirmButton onConfirm={() => remove(c.id)} message="Eliminar esta certificação?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></ConfirmButton>
              </div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
