'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Labour } from '@/lib/supabase/types'
import { eur } from '@/lib/materials'
import { Search, Plus, Pencil, Trash2, HardHat, X } from 'lucide-react'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Draft = Partial<Labour> & { initialCost?: string }

export default function LabourManager({ initial, canEdit }: { initial: Labour[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Labour[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  const visible = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter(r => r.name.toLowerCase().includes(s)) : rows }, [rows, q])
  async function refresh() { const { data } = await supabase.from('labour').select('*').order('name'); setRows((data ?? []) as Labour[]) }

  async function save() {
    if (!draft?.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    if (draft.id) {
      const { error } = await supabase.from('labour').update({ name: draft.name!.trim(), notes: draft.notes || null }).eq('id', draft.id)
      setSaving(false); if (error) { setError(error.message); return }
    } else {
      const cost = draft.initialCost ? Number(draft.initialCost) : null
      const { data, error } = await supabase.from('labour').insert({ name: draft.name!.trim(), hourly_cost: cost, notes: draft.notes || null }).select().single()
      if (error) { setSaving(false); setError(error.message); return }
      if (cost != null && data) await supabase.from('labour_prices').insert({ labour_id: data.id, hourly_cost: cost, source: 'manual' })
      setSaving(false)
    }
    setDraft(null); refresh()
  }
  async function remove(id: string) { if (confirm('Eliminar esta mão de obra?')) { await supabase.from('labour').delete().eq('id', id); refresh() } }

  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className={`${input} pl-8`} />
        </div>
        {canEdit && <button onClick={() => setDraft({})} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Mão de obra</button>}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]"><tr><th className={th}>Tipo</th><th className={`${th} text-right`}>Custo/hora</th>{canEdit && <th className={`${th} text-right`}>Ações</th>}</tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visible.length === 0 && <tr><td colSpan={canEdit ? 3 : 2} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem mão de obra.</td></tr>}
            {visible.map(row => (
              <tr key={row.id} onClick={() => router.push(`/materiais/mo/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">
                <td className={td}><div className="flex items-center gap-3"><HardHat size={15} className="text-[var(--muted)]" /><span className="font-medium">{row.name}</span></div></td>
                <td className={`${td} text-right`}>{eur(row.hourly_cost)}<span className="text-[var(--muted)]"> /h</span></td>
                {canEdit && <td className={`${td} text-right whitespace-nowrap`}>
                  <button onClick={e => { e.stopPropagation(); setDraft(row) }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                  <button onClick={e => { e.stopPropagation(); remove(row.id) }} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-md my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Nova'} mão de obra</h2><button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className={label}>Tipo *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="ex. Pedreiro" /></div>
              {!draft.id && <div><label className={label}>Custo/hora inicial</label><input type="number" step="0.01" className={input} value={draft.initialCost ?? ''} onChange={e => setDraft({ ...draft, initialCost: e.target.value })} /></div>}
              <div><label className={label}>Notas</label><textarea rows={2} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
              <p className="text-xs text-[var(--muted)]">O custo/hora será calculado do ordenado bruto quando afinarmos essa fórmula.</p>
            </div>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDraft(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
