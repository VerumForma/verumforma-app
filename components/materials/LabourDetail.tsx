'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Labour, LabourPrice } from '@/lib/supabase/types'
import { eur } from '@/lib/materials'
import PriceChart from './PriceChart'
import { inputCls, labelCls } from '@/lib/formClasses'
import { ArrowLeft, HardHat, Plus, Trash2, Pencil, X } from 'lucide-react'

export default function LabourDetail({ labour, prices, canEdit }: { labour: Labour; prices: LabourPrice[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [nc, setNc] = useState({ cost: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState<null | { name: string; notes: string }>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErr, setEditErr] = useState('')

  async function addCost() {
    if (!nc.cost) return
    setSaving(true)
    const cost = Number(nc.cost)
    await supabase.from('labour_prices').insert({ labour_id: labour.id, hourly_cost: cost, price_date: nc.date, source: 'manual' })
    const latest = [...prices, { hourly_cost: cost, price_date: nc.date } as LabourPrice].sort((a, b) => a.price_date.localeCompare(b.price_date)).at(-1)
    await supabase.from('labour').update({ hourly_cost: latest?.hourly_cost ?? cost }).eq('id', labour.id)
    setSaving(false); setAdding(false); setNc({ cost: '', date: new Date().toISOString().slice(0, 10) }); router.refresh()
  }
  async function removeCost(id: string) {
    if (!confirm('Eliminar este registo?')) return
    await supabase.from('labour_prices').delete().eq('id', id)
    const rest = prices.filter(p => p.id !== id).sort((a, b) => a.price_date.localeCompare(b.price_date))
    await supabase.from('labour').update({ hourly_cost: rest.at(-1)?.hourly_cost ?? null }).eq('id', labour.id)
    router.refresh()
  }
  async function saveEdit() {
    if (!edit?.name.trim()) { setEditErr('O nome é obrigatório.'); return }
    setSavingEdit(true); setEditErr('')
    const { error } = await supabase.from('labour').update({ name: edit.name.trim(), notes: edit.notes || null }).eq('id', labour.id)
    setSavingEdit(false)
    if (error) { setEditErr(error.message); return }
    setEdit(null); router.refresh()
  }

  const chartPoints = prices.map(p => ({ date: p.price_date, price: p.hourly_cost }))
  const subtitle = ['Mão de obra', labour.notes].filter(Boolean).join(' · ')

  return (
    <div className="w-full">
      <Link href="/materiais" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Materiais</Link>

      <div className="flex items-start gap-4 mb-6">
        <span className="w-12 h-12 rounded-[8px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]"><HardHat size={20} /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-playfair text-3xl leading-tight">{labour.name}</h1>
            {canEdit && <button onClick={() => setEdit({ name: labour.name, notes: labour.notes ?? '' })} className="text-[var(--muted)] hover:text-[#1A1A1A]" aria-label="Editar"><Pencil size={16} /></button>}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
        </div>
        <div className="text-right shrink-0"><p className="font-playfair text-2xl">{eur(labour.hourly_cost)}</p><p className="text-xs text-[var(--muted)]">custo atual /h</p></div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Evolução do custo/hora</p>
          {canEdit && !adding && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Registar custo</button>}
        </div>
        {adding && (
          <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Custo/hora</label><input type="number" step="0.01" className={inputCls} value={nc.cost} onChange={e => setNc({ ...nc, cost: e.target.value })} /></div>
            <div><label className={labelCls}>Data</label><input type="date" className={inputCls} value={nc.date} onChange={e => setNc({ ...nc, date: e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button onClick={() => setAdding(false)} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={addCost} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        )}
        <PriceChart points={chartPoints} suffix="/h" />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 mt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-4">Histórico</p>
        {prices.length === 0 && <p className="text-sm text-[var(--muted)]">Sem registos.</p>}
        <div className="divide-y divide-[var(--border)]">
          {[...prices].sort((a, b) => b.price_date.localeCompare(a.price_date)).map(pr => (
            <div key={pr.id} className="flex items-center gap-4 py-2.5 text-sm first:pt-0">
              <span className="w-28 text-[var(--muted)]">{pr.price_date}</span>
              <span className="flex-1 text-[var(--muted)]">{pr.source === 'manual' ? 'Manual' : pr.source}</span>
              <span className="font-medium">{eur(pr.hourly_cost)}/h</span>
              {canEdit && <button onClick={() => removeCost(pr.id)} className="text-[var(--muted)] hover:text-red-500 p-1"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-md my-8 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-playfair text-2xl">Editar mão de obra</h2><button onClick={() => setEdit(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className={labelCls}>Tipo *</label><input className={inputCls} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><label className={labelCls}>Notas</label><textarea rows={2} className={inputCls} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
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
