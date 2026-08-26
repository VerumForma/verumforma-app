'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Material, MaterialPrice, MaterialUnit } from '@/lib/supabase/types'
import { UNITS, UNIT_LABEL, eur } from '@/lib/materials'
import PriceChart from './PriceChart'
import MaterialUnitsCard from './MaterialUnitsCard'
import { inputCls, labelCls } from '@/lib/formClasses'
import { ArrowLeft, Package, Plus, Trash2, Pencil, X } from 'lucide-react'

type Supplier = { id: string; name: string }

export default function MaterialDetail({ material, prices, suppliers, units, canEdit }: { material: Material; prices: MaterialPrice[]; suppliers: Supplier[]; units: MaterialUnit[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const supName = (id: string | null) => suppliers.find(s => s.id === id)?.name ?? null
  const unit = UNIT_LABEL[material.unit] ?? material.unit

  const [adding, setAdding] = useState(false)
  const [np, setNp] = useState({ price: '', date: new Date().toISOString().slice(0, 10), supplier_id: '' })
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState<null | { name: string; category: string; unit: string; notes: string }>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErr, setEditErr] = useState('')

  async function addPrice() {
    if (!np.price) return
    setSaving(true)
    const price = Number(np.price)
    await supabase.from('material_prices').insert({ material_id: material.id, supplier_id: np.supplier_id || null, price, price_date: np.date, source: 'manual' })
    const latest = [...prices, { price, price_date: np.date } as MaterialPrice].sort((a, b) => a.price_date.localeCompare(b.price_date)).at(-1)
    await supabase.from('materials').update({ current_price: latest?.price ?? price }).eq('id', material.id)
    setSaving(false); setAdding(false); setNp({ price: '', date: new Date().toISOString().slice(0, 10), supplier_id: '' }); router.refresh()
  }
  async function removePrice(id: string) {
    if (!confirm('Eliminar este registo de preço?')) return
    await supabase.from('material_prices').delete().eq('id', id)
    const rest = prices.filter(p => p.id !== id).sort((a, b) => a.price_date.localeCompare(b.price_date))
    await supabase.from('materials').update({ current_price: rest.at(-1)?.price ?? null }).eq('id', material.id)
    router.refresh()
  }
  async function saveEdit() {
    if (!edit?.name.trim()) { setEditErr('O nome é obrigatório.'); return }
    setSavingEdit(true); setEditErr('')
    const { error } = await supabase.from('materials').update({ name: edit.name.trim(), category: edit.category || null, unit: edit.unit, notes: edit.notes || null }).eq('id', material.id)
    setSavingEdit(false)
    if (error) { setEditErr(error.message); return }
    setEdit(null); router.refresh()
  }

  const chartPoints = prices.map(p => ({ date: p.price_date, price: p.price, supplier: supName(p.supplier_id) }))
  const subtitle = [material.category, `Unidade: ${unit}`, material.notes].filter(Boolean).join(' · ')

  return (
    <div className="w-full">
      <Link href="/materiais" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Materiais</Link>

      <div className="flex items-start gap-4 mb-6">
        <span className="w-12 h-12 rounded-[8px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]"><Package size={20} /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-playfair text-3xl leading-tight">{material.name}</h1>
            {canEdit && <button onClick={() => setEdit({ name: material.name, category: material.category ?? '', unit: material.unit, notes: material.notes ?? '' })} className="text-[var(--muted)] hover:text-[#1A1A1A]" aria-label="Editar"><Pencil size={16} /></button>}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
        </div>
        <div className="text-right shrink-0"><p className="font-playfair text-2xl">{eur(material.current_price)}</p><p className="text-xs text-[var(--muted)]">preço atual /{unit}</p></div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Evolução do preço</p>
          {canEdit && !adding && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Registar preço</button>}
        </div>
        {adding && (
          <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Preço</label><input type="number" step="0.0001" className={inputCls} value={np.price} onChange={e => setNp({ ...np, price: e.target.value })} /></div>
            <div><label className={labelCls}>Data</label><input type="date" className={inputCls} value={np.date} onChange={e => setNp({ ...np, date: e.target.value })} /></div>
            <div><label className={labelCls}>Fornecedor</label><select className={inputCls} value={np.supplier_id} onChange={e => setNp({ ...np, supplier_id: e.target.value })}><option value="">—</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="sm:col-span-3 flex justify-end gap-3">
              <button onClick={() => setAdding(false)} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={addPrice} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        )}
        <PriceChart points={chartPoints} suffix={`/${unit}`} />
      </div>

      <MaterialUnitsCard materialId={material.id} baseUnit={material.unit} initial={units} canEdit={canEdit} />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 mt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-4">Histórico</p>
        {prices.length === 0 && <p className="text-sm text-[var(--muted)]">Sem registos.</p>}
        <div className="divide-y divide-[var(--border)]">
          {[...prices].sort((a, b) => b.price_date.localeCompare(a.price_date)).map(pr => (
            <div key={pr.id} className="flex items-center gap-4 py-2.5 text-sm first:pt-0">
              <span className="w-28 text-[var(--muted)]">{pr.price_date}</span>
              <span className="flex-1 text-[var(--muted)]">{supName(pr.supplier_id) || (pr.source === 'manual' ? 'Manual' : '—')}</span>
              <span className="font-medium">{eur(pr.price)}/{unit}</span>
              {canEdit && <button onClick={() => removePrice(pr.id)} className="text-[var(--muted)] hover:text-red-500 p-1"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-lg my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">Editar material</h2><button onClick={() => setEdit(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={labelCls}>Nome *</label><input className={inputCls} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><label className={labelCls}>Categoria</label><input className={inputCls} value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })} /></div>
              <div><label className={labelCls}>Unidade</label><select className={inputCls} value={edit.unit} onChange={e => setEdit({ ...edit, unit: e.target.value })}>{UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
              <div className="md:col-span-2"><label className={labelCls}>Notas</label><textarea rows={2} className={inputCls} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
            </div>
            {editErr && <p className="text-xs text-red-500 mt-3">{editErr}</p>}
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
