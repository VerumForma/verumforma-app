'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MaterialUnit } from '@/lib/supabase/types'
import { UNITS, UNIT_LABEL } from '@/lib/materials'
import { inputCls, labelCls } from '@/lib/formClasses'
import { Plus, Trash2, Pencil } from 'lucide-react'

export default function MaterialUnitsCard({ materialId, baseUnit, initial, canEdit }: { materialId: string; baseUnit: string; initial: MaterialUnit[]; canEdit: boolean }) {
  const baseLabel = UNIT_LABEL[baseUnit] ?? baseUnit
  const supabase = createClient()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState({ label: '', per_base: '' })
  const [saving, setSaving] = useState(false)

  function reset() { setAdding(false); setEditId(null); setF({ label: '', per_base: '' }) }
  function startEdit(u: MaterialUnit) { setF({ label: u.label, per_base: String(u.per_base) }); setEditId(u.id); setAdding(true) }
  async function save() {
    if (!f.label.trim() || !f.per_base) return
    setSaving(true)
    const payload = { label: f.label.trim(), per_base: Number(f.per_base) }
    if (editId) await supabase.from('material_units').update(payload).eq('id', editId)
    else await supabase.from('material_units').insert({ ...payload, material_id: materialId })
    setSaving(false); reset(); router.refresh()
  }
  async function remove(id: string) { if (!confirm('Eliminar esta unidade?')) return; await supabase.from('material_units').delete().eq('id', id); router.refresh() }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Unidades e conversões</p>
        {canEdit && !adding && <button onClick={() => { reset(); setAdding(true) }} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Unidade</button>}
      </div>
      <p className="text-sm text-[var(--muted)] mb-4">Unidade base: <span className="text-[#1A1A1A] font-medium">{baseLabel}</span> — onde vive o preço. Adiciona equivalências para usares outras unidades na composição (ex. 1 saco = 25 kg).</p>

      {adding && (
        <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4">
          <div className="flex items-end gap-2 flex-wrap">
            <span className="text-sm text-[var(--muted)] pb-2 shrink-0">1 {baseLabel} =</span>
            <div className="w-28"><label className={labelCls}>Quantidade</label><input type="number" step="0.0001" className={inputCls} value={f.per_base} onChange={e => setF({ ...f, per_base: e.target.value })} placeholder="ex. 25" /></div>
            <div className="flex-1 min-w-[120px]"><label className={labelCls}>Unidade</label><select className={inputCls} value={f.label} onChange={e => setF({ ...f, label: e.target.value })}><option value="">Escolher…</option>{UNITS.filter(u => u.key !== baseUnit).map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={reset} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
            <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : (editId ? 'Guardar' : 'Adicionar')}</button>
          </div>
        </div>
      )}

      {initial.length === 0 && !adding && <p className="text-sm text-[var(--muted)]">Sem unidades alternativas — só podes usar «{baseLabel}» na composição.</p>}
      <div className="divide-y divide-[var(--border)]">
        {initial.map(u => (
          <div key={u.id} className="flex items-center gap-4 py-2.5 text-sm first:pt-0">
            <span className="flex-1">1 {baseLabel} = <span className="font-medium">{u.per_base} {UNIT_LABEL[u.label] ?? u.label}</span></span>
            {canEdit && <><button onClick={() => startEdit(u)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={14} /></button><button onClick={() => remove(u.id)} className="text-[var(--muted)] hover:text-red-500 p-1"><Trash2 size={14} /></button></>}
          </div>
        ))}
      </div>
    </div>
  )
}
