'use client'

import { createClient } from '@/lib/supabase/client'
import type { StaffPersonal } from '@/lib/supabase/types'
import EditableSection from '@/components/ui/EditableSection'
import { User } from 'lucide-react'
import { inputCls, labelCls } from '@/lib/formClasses'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
type F = { birth_date: string; cc: string; nif: string; niss: string; street: string; door: string; postal_code: string; city: string }

export default function StaffPersonalCard({ staffId, initial, canEdit }: { staffId: string; initial: StaffPersonal | null; canEdit: boolean }) {
  const supabase = createClient()
  const init: F = {
    birth_date: initial?.birth_date ?? '', cc: initial?.cc ?? '', nif: initial?.nif ?? '', niss: initial?.niss ?? '',
    street: initial?.street ?? '', door: initial?.door ?? '', postal_code: initial?.postal_code ?? '', city: initial?.city ?? '',
  }
  const addressLine = (v: F) => [v.street, v.door && `nº ${v.door}`, v.postal_code, v.city].filter(Boolean).join(', ') || '—'

  return (
    <EditableSection title="Dados pessoais" icon={<User size={15} />} canEdit={canEdit} initial={init}
      onSave={async d => { const { error } = await supabase.from('staff_personal').upsert({ staff_id: staffId, birth_date: d.birth_date || null, cc: d.cc || null, nif: d.nif || null, niss: d.niss || null, street: d.street || null, door: d.door || null, postal_code: d.postal_code || null, city: d.city || null }, { onConflict: 'staff_id' }); return error ? error.message : null }}>
      {({ editing, value, set }) => editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>Data de nascimento</label><input type="date" className={inputCls} value={value.birth_date} onChange={e => set({ birth_date: e.target.value })} /></div>
          <div><label className={labelCls}>Cartão de Cidadão</label><input className={inputCls} value={value.cc} onChange={e => set({ cc: e.target.value })} /></div>
          <div><label className={labelCls}>NIF</label><input className={inputCls} value={value.nif} onChange={e => set({ nif: e.target.value })} /></div>
          <div><label className={labelCls}>NISS</label><input className={inputCls} value={value.niss} onChange={e => set({ niss: e.target.value })} /></div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-4"><label className={labelCls}>Rua</label><input className={inputCls} value={value.street} onChange={e => set({ street: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Nº porta</label><input className={inputCls} value={value.door} onChange={e => set({ door: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Código postal</label><input className={inputCls} value={value.postal_code} onChange={e => set({ postal_code: e.target.value })} placeholder="0000-000" /></div>
            <div className="md:col-span-4"><label className={labelCls}>Cidade</label><input className={inputCls} value={value.city} onChange={e => set({ city: e.target.value })} /></div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Nascimento</span><span>{fmt(value.birth_date)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Cartão de Cidadão</span><span>{value.cc || '—'}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">NIF</span><span>{value.nif || '—'}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">NISS</span><span>{value.niss || '—'}</span></div>
          <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Morada</span><span className="text-right">{addressLine(value)}</span></div>
        </div>
      )}
    </EditableSection>
  )
}
