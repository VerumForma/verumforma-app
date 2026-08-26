'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ClientContact } from '@/lib/supabase/types'
import { buildContactVCard, downloadVCard } from '@/lib/vcard'
import { Plus, Pencil, Trash2, Star, Download, Users } from 'lucide-react'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Draft = Partial<ClientContact>

export default function ClientContacts({ clientId, initial, canEdit, orgName }: { clientId: string; initial: ClientContact[]; canEdit: boolean; orgName?: string }) {
  const supabase = createClient()
  const [rows, setRows] = useState<ClientContact[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const { data } = await supabase.from('client_contacts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name')
    setRows((data ?? []) as ClientContact[])
  }
  async function save() {
    if (!draft?.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    const base = { name: draft.name!.trim(), role: draft.role || null, email: draft.email || null, phone: draft.phone || null, is_primary: !!draft.is_primary, notes: draft.notes || null }
    const { error } = draft.id
      ? await supabase.from('client_contacts').update(base).eq('id', draft.id)
      : await supabase.from('client_contacts').insert({ ...base, client_id: clientId })
    setSaving(false)
    if (error) { setError(error.message); return }
    setDraft(null); refresh()
  }
  async function remove(id: string) { if (confirm('Eliminar este contacto?')) { await supabase.from('client_contacts').delete().eq('id', id); refresh() } }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] inline-flex items-center gap-2"><Users size={15} /> Contactos na empresa</p>
        {canEdit && !draft && <button onClick={() => setDraft({ name: '', is_primary: false })} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Adicionar</button>}
      </div>

      {draft && (
        <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><label className={label}>Cargo / função</label><input className={input} value={draft.role ?? ''} onChange={e => setDraft({ ...draft, role: e.target.value })} /></div>
            <div><label className={label}>Email</label><input className={input} value={draft.email ?? ''} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
            <div><label className={label}>Telefone</label><input className={input} value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={2} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer"><input type="checkbox" checked={!!draft.is_primary} onChange={e => setDraft({ ...draft, is_primary: e.target.checked })} /> Contacto principal</label>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDraft(null)} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
            <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {rows.length === 0 && !draft && <p className="text-sm text-[var(--muted)]">Ainda não há contactos registados.</p>}
      <div className="divide-y divide-[var(--border)]">
        {rows.map(c => (
          <div key={c.id} className="flex items-start gap-4 py-3 first:pt-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium flex items-center gap-1.5">
                {c.is_primary && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                {c.name}{c.role && <span className="text-[var(--muted)] font-normal">· {c.role}</span>}
              </p>
              <p className="text-xs text-[var(--muted)] truncate">{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</p>
              {c.notes && <p className="text-xs text-[var(--muted)] mt-1">{c.notes}</p>}
            </div>
            <div className="shrink-0 whitespace-nowrap">
              <button onClick={() => downloadVCard(`${c.name}.vcf`, buildContactVCard(c, orgName))} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Exportar (.vcf)"><Download size={15} /></button>
              {canEdit && <>
                <button onClick={() => { setDraft(c); setError('') }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1 ml-1"><Pencil size={15} /></button>
                <button onClick={() => remove(c.id)} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></button>
              </>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
