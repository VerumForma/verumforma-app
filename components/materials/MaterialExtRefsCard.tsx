'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MaterialExternalRef } from '@/lib/supabase/types'
import { inputCls, labelCls } from '@/lib/formClasses'
import { Plus, Trash2, Hash } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'

type Supplier = { id: string; name: string }

export default function MaterialExtRefsCard({ materialId, suppliers, initial, canEdit }: { materialId: string; suppliers: Supplier[]; initial: MaterialExternalRef[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [ref, setRef] = useState('')
  const [sup, setSup] = useState('')
  const [saving, setSaving] = useState(false)
  const supName = (id: string | null) => suppliers.find(s => s.id === id)?.name ?? 'Qualquer fornecedor'

  async function add() {
    if (!ref.trim()) return
    setSaving(true)
    await supabase.from('material_external_refs').insert({ material_id: materialId, supplier_id: sup || null, external_ref: ref.trim() })
    setSaving(false); setRef(''); setSup(''); setAdding(false); router.refresh()
  }
  async function remove(id: string) { await supabase.from('material_external_refs').delete().eq('id', id); router.refresh() }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] flex items-center gap-2"><Hash size={14} /> IDs externos (referências de fornecedor)</p>
        {canEdit && !adding && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#1A1A1A] hover:opacity-70"><Plus size={14} /> Adicionar</button>}
      </div>
      {adding && (
        <div className="border border-[var(--border)] rounded-[6px] p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>Fornecedor</label><select className={inputCls} value={sup} onChange={e => setSup(e.target.value)}><option value="">— Qualquer —</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="sm:col-span-2"><label className={labelCls}>Referência externa</label><input className={inputCls} value={ref} onChange={e => setRef(e.target.value)} placeholder="ex. CG454" /></div>
          <div className="sm:col-span-3 flex justify-end gap-3">
            <button onClick={() => { setAdding(false); setRef(''); setSup('') }} className="text-sm px-4 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
            <button onClick={add} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
          </div>
        </div>
      )}
      {initial.length === 0 && <p className="text-sm text-[var(--muted)]">Sem IDs externos. Adiciona as referências que os fornecedores usam para este material — o importador de faturas passa a associá-las automaticamente.</p>}
      <div className="divide-y divide-[var(--border)]">
        {initial.map(r => (
          <div key={r.id} className="flex items-center gap-4 py-2.5 text-sm first:pt-0">
            <span className="font-mono font-medium">{r.external_ref}</span>
            <span className="flex-1 text-[var(--muted)]">{supName(r.supplier_id)}</span>
            {canEdit && <ConfirmButton onConfirm={() => remove(r.id)} message="Eliminar este ID externo?" className="text-[var(--muted)] hover:text-red-500 p-1"><Trash2 size={14} /></ConfirmButton>}
          </div>
        ))}
      </div>
    </div>
  )
}
