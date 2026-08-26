'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Composite, CompositeItem, Material, Labour, MaterialUnit } from '@/lib/supabase/types'
import { UNITS, UNIT_LABEL, eur, compositeCost } from '@/lib/materials'
import { inputCls, labelCls } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import { ArrowLeft, Layers, Plus, Trash2, Pencil, X, Package, HardHat } from 'lucide-react'

export default function CompositeDetail({ composite, items, materials, labour, materialUnits, composites, childCosts, canEdit }: { composite: Composite; items: CompositeItem[]; materials: Material[]; labour: Labour[]; materialUnits: MaterialUnit[]; composites: { id: string; name: string; unit: string }[]; childCosts: Record<string, number>; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const unit = UNIT_LABEL[composite.unit] ?? composite.unit
  const matById = Object.fromEntries(materials.map(m => [m.id, m]))
  const labById = Object.fromEntries(labour.map(l => [l.id, l]))
  const compById = Object.fromEntries(composites.map(c => [c.id, c]))
  const unitPer: Record<string, Record<string, number>> = {}
  for (const mu of materialUnits) { (unitPer[mu.material_id] ||= {})[mu.label] = mu.per_base }
  const unitsFor = (materialId: string) => Object.keys(unitPer[materialId] ?? {})

  const resolve = (it: CompositeItem) => {
    if (it.kind === 'material') {
      const m = it.material_id ? matById[it.material_id] : null
      const baseLabel = m ? (UNIT_LABEL[m.unit] ?? m.unit) : ''
      const per = it.unit ? (unitPer[it.material_id ?? '']?.[it.unit] ?? 1) : 1
      return { name: m?.name ?? '(removido)', price: m?.current_price ?? 0, u: it.unit ? (UNIT_LABEL[it.unit] ?? it.unit) : baseLabel, baseQty: it.quantity / (per || 1) }
    }
    if (it.kind === 'composite') {
      const c = it.composite_ref_id ? compById[it.composite_ref_id] : null
      return { name: c?.name ?? '(removido)', price: childCosts[it.composite_ref_id ?? ''] ?? 0, u: c ? (UNIT_LABEL[c.unit] ?? c.unit) : '', baseQty: it.quantity }
    }
    const l = it.labour_id ? labById[it.labour_id] : null; return { name: l?.name ?? '(removido)', price: l?.hourly_cost ?? 0, u: 'h', baseQty: it.quantity }
  }
  const lines = items.map(it => { const r = resolve(it); return { kind: it.kind, quantity: r.baseQty, price: r.price } })
  const cost = compositeCost(lines, composite.waste_pct)

  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [ni, setNi] = useState<{ kind: 'material' | 'labour' | 'composite'; id: string; unit: string; quantity: string; note: string }>({ kind: 'material', id: '', unit: '', quantity: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState<null | { name: string; category: string; unit: string; waste_pct: number; notes: string }>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  function resetForm() { setAdding(false); setEditId(null); setNi({ kind: 'material', id: '', unit: '', quantity: '', note: '' }) }
  function startEdit(it: CompositeItem) {
    setNi({ kind: it.kind, id: (it.kind === 'material' ? it.material_id : it.kind === 'labour' ? it.labour_id : it.composite_ref_id) ?? '', unit: it.unit ?? '', quantity: String(it.quantity), note: it.note ?? '' })
    setEditId(it.id); setAdding(true)
  }
  async function saveItem() {
    if (!ni.id || !ni.quantity) return
    setSaving(true)
    const payload = { kind: ni.kind, material_id: ni.kind === 'material' ? ni.id : null, labour_id: ni.kind === 'labour' ? ni.id : null, composite_ref_id: ni.kind === 'composite' ? ni.id : null, quantity: Number(ni.quantity), unit: ni.kind === 'material' ? (ni.unit || null) : null, note: ni.note || null }
    if (editId) await supabase.from('composite_items').update(payload).eq('id', editId)
    else await supabase.from('composite_items').insert({ ...payload, composite_id: composite.id, sort: items.length })
    setSaving(false); resetForm(); router.refresh()
  }
  async function removeItem(id: string) { await supabase.from('composite_items').delete().eq('id', id); router.refresh() }
  async function saveEdit() {
    if (!edit?.name.trim()) return
    setSavingEdit(true)
    await supabase.from('composites').update({ name: edit.name.trim(), category: edit.category || null, unit: edit.unit, waste_pct: Number(edit.waste_pct) || 0, notes: edit.notes || null }).eq('id', composite.id)
    setSavingEdit(false); setEdit(null); router.refresh()
  }

  const selUnitLabel = () => {
    if (ni.kind === 'labour') return 'horas'
    if (ni.kind === 'composite') { const c = compById[ni.id]; return c ? (UNIT_LABEL[c.unit] ?? c.unit) : '' }
    const m = matById[ni.id]; return ni.unit ? (UNIT_LABEL[ni.unit] ?? ni.unit) : (m ? (UNIT_LABEL[m.unit] ?? m.unit) : '')
  }
  const subtitle = [composite.category, `Unidade: ${unit}`, `Desperdício: ${composite.waste_pct}%`, composite.notes].filter(Boolean).join(' · ')
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-3 py-2'
  const td = 'px-3 py-2.5 text-sm'

  return (
    <div className="w-full">
      <Link href="/materiais" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Materiais</Link>

      <div className="flex items-start gap-4 mb-6">
        <span className="w-12 h-12 rounded-[8px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]"><Layers size={20} /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2"><h1 className="font-playfair text-3xl leading-tight">{composite.name}</h1>{canEdit && <button onClick={() => setEdit({ name: composite.name, category: composite.category ?? '', unit: composite.unit, waste_pct: composite.waste_pct, notes: composite.notes ?? '' })} className="text-[var(--muted)] hover:text-[#1A1A1A]" aria-label="Editar"><Pencil size={16} /></button>}</div>
          <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
        </div>
        <div className="text-right shrink-0"><p className="font-playfair text-2xl">{eur(cost.total)}</p><p className="text-xs text-[var(--muted)]">custo real /{unit}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Composição · por {unit}</p>
            {canEdit && !adding && <button onClick={() => { resetForm(); setAdding(true) }} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Componente</button>}
          </div>

          {adding && (
            <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>Tipo</label><select className={inputCls} value={ni.kind} onChange={e => setNi({ ...ni, kind: e.target.value as 'material' | 'labour' | 'composite', id: '', unit: '' })}><option value="material">Material</option><option value="labour">Mão de obra</option><option value="composite">Artigo composto</option></select></div>
                <div><label className={labelCls}>{ni.kind === 'material' ? 'Material' : ni.kind === 'labour' ? 'Mão de obra' : 'Artigo composto'}</label>
                  <SearchSelect options={ni.kind === 'composite' ? composites.filter(c => c.id !== composite.id).map(c => ({ id: c.id, label: c.name })) : (ni.kind === 'material' ? materials : labour).map(o => ({ id: o.id, label: o.name }))} value={ni.id} onChange={id => setNi({ ...ni, id, unit: '' })} placeholder="Procurar e selecionar…" />
                </div>
                {ni.kind === 'material' && (
                  <div><label className={labelCls}>Unidade de medida</label>
                    <select className={inputCls} value={ni.unit} onChange={e => setNi({ ...ni, unit: e.target.value })} disabled={!ni.id}>
                      <option value="">{(() => { const m = matById[ni.id]; return m ? (UNIT_LABEL[m.unit] ?? m.unit) + ' (base)' : 'unidade base' })()}</option>
                      {unitsFor(ni.id).map(k => <option key={k} value={k}>{UNIT_LABEL[k] ?? k}</option>)}
                    </select>
                  </div>
                )}
                <div><label className={labelCls}>Quantidade por {unit}{selUnitLabel() ? ` (${selUnitLabel()})` : ''}</label><input type="number" step="0.0001" className={inputCls} value={ni.quantity} onChange={e => setNi({ ...ni, quantity: e.target.value })} /></div>
                <div><label className={labelCls}>Nota (raciocínio)</label><input className={inputCls} value={ni.note} onChange={e => setNi({ ...ni, note: e.target.value })} placeholder="ex. junta de 2cm" /></div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={resetForm} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
                <button onClick={saveItem} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : (editId ? 'Guardar' : 'Adicionar')}</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="border-b border-[var(--border)]"><tr><th className={th}>Componente</th><th className={`${th} text-right`}>Qtd</th><th className={`${th} text-right`}>Preço un.</th><th className={`${th} text-right`}>Subtotal</th>{canEdit && <th className={th}></th>}</tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.length === 0 && <tr><td colSpan={canEdit ? 5 : 4} className="px-3 py-6 text-center text-sm text-[var(--muted)]">Sem componentes. Adiciona materiais e mão de obra.</td></tr>}
                {items.map(it => {
                  const r = resolve(it)
                  return (
                    <tr key={it.id}>
                      <td className={td}>
                        <div className="flex items-center gap-2">{it.kind === 'material' ? <Package size={14} className="text-[var(--muted)]" /> : it.kind === 'composite' ? <Layers size={14} className="text-[var(--muted)]" /> : <HardHat size={14} className="text-[var(--muted)]" />}<span className="font-medium">{r.name}</span></div>
                        {it.note && <p className="text-xs text-[var(--muted)] mt-0.5 ml-6">{it.note}</p>}
                      </td>
                      <td className={`${td} text-right whitespace-nowrap`}>{it.quantity} {r.u}</td>
                      <td className={`${td} text-right whitespace-nowrap text-[var(--muted)]`}>{eur(r.price)}</td>
                      <td className={`${td} text-right whitespace-nowrap font-medium`}>{eur(r.baseQty * r.price)}</td>
                      {canEdit && <td className={`${td} text-right whitespace-nowrap`}><button onClick={() => startEdit(it)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={14} /></button><button onClick={() => removeItem(it.id)} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={14} /></button></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-4">Custo real (sem lucro)</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--muted)]">Materiais</span><span>{eur(cost.materials)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Mão de obra</span><span>{eur(cost.labour)}</span></div>
            {cost.composites > 0 && <div className="flex justify-between"><span className="text-[var(--muted)]">Artigos compostos</span><span>{eur(cost.composites)}</span></div>}
            <div className="flex justify-between border-t border-[var(--border)] pt-2"><span className="text-[var(--muted)]">Subtotal</span><span>{eur(cost.sub)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Desperdício ({composite.waste_pct}%)</span><span>{eur(cost.waste)}</span></div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base"><span className="font-medium">Total /{unit}</span><span className="font-playfair text-xl">{eur(cost.total)}</span></div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-4 pt-4 border-t border-[var(--border)]">O lucro é aplicado ao nível do Orçamento, não aqui.</p>
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-lg my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">Editar artigo</h2><button onClick={() => setEdit(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={labelCls}>Nome *</label><input className={inputCls} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><label className={labelCls}>Categoria</label><input className={inputCls} value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })} /></div>
              <div><label className={labelCls}>Unidade</label><select className={inputCls} value={edit.unit} onChange={e => setEdit({ ...edit, unit: e.target.value })}>{UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
              <div><label className={labelCls}>Desperdício (%)</label><input type="number" step="0.1" className={inputCls} value={edit.waste_pct} onChange={e => setEdit({ ...edit, waste_pct: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><label className={labelCls}>Notas</label><textarea rows={2} className={inputCls} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEdit(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={saveEdit} disabled={savingEdit} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{savingEdit ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
