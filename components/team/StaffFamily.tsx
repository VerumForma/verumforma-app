'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StaffFamily } from '@/lib/supabase/types'
import { Plus, Pencil, Trash2, Phone, Gift, CalendarHeart, Heart } from 'lucide-react'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Draft = Partial<StaffFamily>
const REL: Record<string, string> = { conjuge: 'Cônjuge', filho: 'Filho/a', outro: 'Outro' }
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : null

export default function StaffFamily({ staffId, initial, canEdit, showGift }: { staffId: string; initial: StaffFamily[]; canEdit: boolean; showGift: boolean }) {
  const supabase = createClient()
  const [rows, setRows] = useState<StaffFamily[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('staff_family').select('*').eq('staff_id', staffId).order('relation')
    setRows((data ?? []) as StaffFamily[])
  }
  async function save() {
    if (!draft?.name?.trim()) return
    setSaving(true)
    const base = { relation: draft.relation ?? 'outro', name: draft.name!.trim(), birthday: draft.birthday || null, phone: draft.phone || null, is_emergency: !!draft.is_emergency, gift_amount: draft.relation === 'filho' ? (draft.gift_amount ?? null) : null }
    const { error } = draft.id
      ? await supabase.from('staff_family').update(base).eq('id', draft.id)
      : await supabase.from('staff_family').insert({ ...base, staff_id: staffId })
    setSaving(false)
    if (!error) { setDraft(null); refresh() }
  }
  async function remove(id: string) { if (confirm('Eliminar?')) { await supabase.from('staff_family').delete().eq('id', id); refresh() } }
  const benefit = (r: string) => r === 'conjuge' ? { icon: <CalendarHeart size={12} />, text: 'Folga no aniversário' } : r === 'filho' ? { icon: <Gift size={12} />, text: 'Presente no aniversário' } : null

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] inline-flex items-center gap-2"><Heart size={15} /> Família e aniversários</p>
        {canEdit && !draft && <button onClick={() => setDraft({ relation: 'conjuge', name: '' })} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Adicionar</button>}
      </div>

      {draft && (
        <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={label}>Relação</label>
              <select className={input} value={draft.relation ?? 'conjuge'} onChange={e => setDraft({ ...draft, relation: e.target.value as StaffFamily['relation'] })}>
                <option value="conjuge">Cônjuge</option><option value="filho">Filho/a</option><option value="outro">Outro (só emergência)</option>
              </select>
            </div>
            <div><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            {draft.relation !== 'outro' && <div><label className={label}>Data de nascimento</label><input type="date" className={input} value={draft.birthday ?? ''} onChange={e => setDraft({ ...draft, birthday: e.target.value || null })} /></div>}
            <div><label className={label}>Telefone</label><input className={input} value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
            {showGift && draft.relation === 'filho' && <div><label className={label}>Valor de presente (opcional)</label><input type="number" step="0.01" className={input} value={draft.gift_amount ?? ''} onChange={e => setDraft({ ...draft, gift_amount: e.target.value ? Number(e.target.value) : null })} placeholder="ex. 30" /></div>}
          </div>
          <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
            <input type="checkbox" checked={!!draft.is_emergency} onChange={e => setDraft({ ...draft, is_emergency: e.target.checked })} /> É o contacto de emergência
          </label>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDraft(null)} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
            <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {rows.length === 0 && !draft && <p className="text-sm text-[var(--muted)]">Sem registos familiares.</p>}
      <div className="divide-y divide-[var(--border)]">
        {rows.map(f => {
          const b = benefit(f.relation)
          return (
            <div key={f.id} className="flex items-start gap-4 py-3 first:pt-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{f.name} <span className="text-[var(--muted)] font-normal">· {REL[f.relation]}</span></p>
                <p className="text-xs text-[var(--muted)] flex items-center gap-3 flex-wrap">
                  {f.birthday && <span>Aniv. {fmt(f.birthday)}</span>}
                  {f.phone && <span className="inline-flex items-center gap-1"><Phone size={11} /> {f.phone}</span>}
                  {f.is_emergency && <span className="text-[#1A1A1A]">Contacto de emergência</span>}
                  {showGift && f.relation === 'filho' && f.gift_amount != null && <span className="inline-flex items-center gap-1"><Gift size={11} /> {f.gift_amount}€</span>}
                </p>
                {b && <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mt-1 inline-flex items-center gap-1">{b.icon} {b.text}</p>}
              </div>
              {canEdit && <div className="shrink-0 whitespace-nowrap">
                <button onClick={() => setDraft(f)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                <button onClick={() => remove(f.id)} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></button>
              </div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
