'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/lib/supabase/types'
import { UNITS, UNIT_LABEL, eur } from '@/lib/materials'
import { Search, Plus, Pencil, Trash2, Package, X } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import { useRowSelection } from '@/lib/useRowSelection'
import SearchSelect from '@/components/ui/SearchSelect'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Supplier = { id: string; name: string }
type Draft = Partial<Material> & { initialPrice?: string; supplier_id?: string }

export default function MaterialsManager({ initial, suppliers, usage = {}, canEdit, toolbarSlot }: { initial: Material[]; suppliers: Supplier[]; usage?: Record<string, number>; toolbarSlot?: HTMLElement | null; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Material[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r => [r.name, r.category].filter(Boolean).join(' ').toLowerCase().includes(s))
  }, [rows, q])
  const accessors = { code: (r: Material) => r.code, name: (r: Material) => r.name, category: (r: Material) => r.category, unit: (r: Material) => UNIT_LABEL[r.unit] ?? r.unit, price: (r: Material) => r.current_price }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'name', 'asc', 'materiais')
  const sel = useRowSelection(sorted.map(r => r.id))

  async function refresh() {
    const { data } = await supabase.from('materials').select('*').is('deleted_at', null).order('name')
    setRows((data ?? []) as Material[])
  }

  async function save() {
    if (!draft?.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    if (draft.id) {
      const { error } = await supabase.from('materials').update({ name: draft.name!.trim(), category: draft.category || null, unit: draft.unit ?? 'un', notes: draft.notes || null }).eq('id', draft.id)
      setSaving(false)
      if (error) { setError(error.message); return }
    } else {
      const price = draft.initialPrice ? Number(draft.initialPrice) : null
      const { data, error } = await supabase.from('materials').insert({ name: draft.name!.trim(), category: draft.category || null, unit: draft.unit ?? 'un', current_price: price, notes: draft.notes || null }).select().single()
      if (error) { setSaving(false); setError(error.message); return }
      if (price != null && data) await supabase.from('material_prices').insert({ material_id: data.id, supplier_id: draft.supplier_id || null, price, source: 'manual' })
      setSaving(false)
    }
    setDraft(null); refresh()
  }
  async function remove(id: string) {
    if ((usage[id] ?? 0) > 0) await supabase.from('materials').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    else await supabase.from('materials').delete().eq('id', id)
    refresh()
  }

  async function bulkDelete() {
    const ids = sel.selectedIds(); if (!ids.length) return
    const used = ids.filter(id => (usage[id] ?? 0) > 0)
    const free = ids.filter(id => (usage[id] ?? 0) === 0)
    if (used.length) await supabase.from('materials').update({ deleted_at: new Date().toISOString() }).in('id', used)
    if (free.length) await supabase.from('materials').delete().in('id', free)
    sel.clear(); refresh()
  }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  return (
    <div>
      {toolbarSlot && createPortal(<>
        <div className="relative w-56">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar material…" className={`${input} pl-8`} />
        </div>
        {canEdit && <button onClick={() => setDraft({ unit: 'un' })} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Material</button>}
      </>, toolbarSlot)}

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="materiais" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}<SortHeader label="Código" active={sortKey==='code'} dir={sortDir} onClick={() => toggle('code')} /><SortHeader label="Material" active={sortKey==='name'} dir={sortDir} onClick={() => toggle('name')} /><SortHeader label="Categoria" active={sortKey==='category'} dir={sortDir} onClick={() => toggle('category')} /><SortHeader label="Unidade" active={sortKey==='unit'} dir={sortDir} onClick={() => toggle('unit')} /><SortHeader label="Preço atual" align="right" active={sortKey==='price'} dir={sortDir} onClick={() => toggle('price')} />{canEdit && <th className={`${th} text-right`}>Ações</th>}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && <tr><td colSpan={canEdit ? 7 : 5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem materiais.</td></tr>}
            {sorted.map(row => (
              <tr key={row.id} onClick={() => router.push(`/materiais/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                <td className={`${td} font-mono text-[var(--muted)] whitespace-nowrap`}>{row.code ?? '—'}</td>
                <td className={td}><div className="flex items-center gap-3"><Package size={15} className="text-[var(--muted)]" /><span className="font-medium">{row.name}</span></div></td>
                <td className={`${td} text-[var(--muted)]`}>{row.category || '—'}</td>
                <td className={`${td} text-[var(--muted)]`}>{UNIT_LABEL[row.unit] ?? row.unit}</td>
                <td className={`${td} text-right`}>{eur(row.current_price)}<span className="text-[var(--muted)]"> /{UNIT_LABEL[row.unit] ?? row.unit}</span></td>
                {canEdit && <td className={`${td} text-right whitespace-nowrap`}>
                  <button onClick={e => { e.stopPropagation(); setDraft(row) }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                  <ConfirmButton stop onConfirm={() => remove(row.id)} message={(usage[row.id] ?? 0) > 0 ? `Usado em ${usage[row.id]} artigo(s) composto(s). Ao eliminar, o material fica marcado como apagado e esses artigos passam a mostrar um alerta. Continuar?` : 'Eliminar este material?'} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></ConfirmButton>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-lg my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Novo'} material</h2><button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="ex. Tijolo 20cm" /></div>
              <div><label className={label}>Categoria</label><input className={input} value={draft.category ?? ''} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="ex. Alvenaria" /></div>
              <div><label className={label}>Unidade</label><select className={input} value={draft.unit ?? 'un'} onChange={e => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
              {!draft.id && <>
                <div><label className={label}>Preço inicial</label><input type="number" step="0.0001" className={input} value={draft.initialPrice ?? ''} onChange={e => setDraft({ ...draft, initialPrice: e.target.value })} /></div>
                <div><label className={label}>Fornecedor</label><SearchSelect options={suppliers.map(s => ({ id: s.id, label: s.name }))} value={draft.supplier_id ?? ''} onChange={id => setDraft({ ...draft, supplier_id: id })} placeholder="— Nenhum —" /></div>
              </>}
              <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={2} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
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
