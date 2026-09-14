'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Composite } from '@/lib/supabase/types'
import { UNITS, UNIT_LABEL, eur } from '@/lib/materials'
import { Search, Plus, Pencil, Trash2, Layers, X, AlertTriangle } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import { useRowSelection } from '@/lib/useRowSelection'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Draft = Partial<Composite>

export default function CompositesManager({ initial, costs, alertIds = [], canEdit, toolbarSlot }: { initial: Composite[]; costs: Record<string, number>; alertIds?: string[]; toolbarSlot?: HTMLElement | null; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Composite[]>(initial)
  const alert = new Set(alertIds)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  const visible = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter(r => [r.name, r.category].filter(Boolean).join(' ').toLowerCase().includes(s)) : rows }, [rows, q])
  const accessors = { name: (r: Composite) => r.name, category: (r: Composite) => r.category, unit: (r: Composite) => UNIT_LABEL[r.unit] ?? r.unit, cost: (r: Composite) => costs[r.id] ?? 0 }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'name', 'asc', 'compostos')
  const sel = useRowSelection(sorted.map(r => r.id))
  async function refresh() { const { data } = await supabase.from('composites').select('*').order('name'); setRows((data ?? []) as Composite[]) }

  async function save() {
    if (!draft?.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = { name: draft.name!.trim(), category: draft.category || null, unit: draft.unit ?? 'm2', waste_pct: Number(draft.waste_pct) || 0, notes: draft.notes || null }
    if (draft.id) {
      const { error } = await supabase.from('composites').update(payload).eq('id', draft.id)
      setSaving(false); if (error) { setError(error.message); return }
      setDraft(null); refresh()
    } else {
      const { data, error } = await supabase.from('composites').insert(payload).select().single()
      setSaving(false); if (error) { setError(error.message); return }
      if (data) router.push(`/materiais/c/${data.id}`)
    }
  }
  async function remove(id: string) { await supabase.from('composites').delete().eq('id', id); refresh() }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('composites').delete().in('id', ids); sel.clear(); refresh() }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  return (
    <div>
      {toolbarSlot && createPortal(<>
        <div className="relative w-56">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar artigo…" className={`${input} pl-8`} />
        </div>
        {canEdit && <button onClick={() => setDraft({ unit: 'm2', waste_pct: 0 })} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Artigo</button>}
      </>, toolbarSlot)}

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="artigos" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]"><tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}<SortHeader label="Artigo" active={sortKey==='name'} dir={sortDir} onClick={() => toggle('name')} /><SortHeader label="Categoria" active={sortKey==='category'} dir={sortDir} onClick={() => toggle('category')} /><SortHeader label="Unidade" active={sortKey==='unit'} dir={sortDir} onClick={() => toggle('unit')} /><SortHeader label="Custo real" align="right" active={sortKey==='cost'} dir={sortDir} onClick={() => toggle('cost')} />{canEdit && <th className={`${th} text-right`}>Ações</th>}</tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && <tr><td colSpan={canEdit ? 6 : 4} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem artigos.</td></tr>}
            {sorted.map(row => (
              <tr key={row.id} onClick={() => router.push(`/materiais/c/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                <td className={td}><div className="flex items-center gap-3"><Layers size={15} className="text-[var(--muted)]" /><span className="font-medium">{row.name}</span>{alert.has(row.id) && <AlertTriangle size={14} className="text-amber-500" aria-label="Contém material apagado" />}</div></td>
                <td className={`${td} text-[var(--muted)]`}>{row.category || '—'}</td>
                <td className={`${td} text-[var(--muted)]`}>{UNIT_LABEL[row.unit] ?? row.unit}</td>
                <td className={`${td} text-right`}>{eur(costs[row.id])}<span className="text-[var(--muted)]"> /{UNIT_LABEL[row.unit] ?? row.unit}</span></td>
                {canEdit && <td className={`${td} text-right whitespace-nowrap`}>
                  <button onClick={e => { e.stopPropagation(); setDraft(row) }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                  <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar este artigo?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></ConfirmButton>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-lg my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Novo'} artigo composto</h2><button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="ex. Parede tijolo 20cm" /></div>
              <div><label className={label}>Categoria</label><input className={input} value={draft.category ?? ''} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="ex. Alvenaria" /></div>
              <div><label className={label}>Unidade de medição</label><select className={input} value={draft.unit ?? 'm2'} onChange={e => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
              <div><label className={label}>Coeficiente de desperdício (%)</label><input type="number" step="0.1" className={input} value={draft.waste_pct ?? 0} onChange={e => setDraft({ ...draft, waste_pct: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={2} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
            </div>
            {!draft.id && <p className="text-xs text-[var(--muted)] mt-3">Depois de criar, adicionas a composição (materiais + mão de obra) na ficha.</p>}
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDraft(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : (draft.id ? 'Guardar' : 'Criar e compor')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
