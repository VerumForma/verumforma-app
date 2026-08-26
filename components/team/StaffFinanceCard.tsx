'use client'

import { createClient } from '@/lib/supabase/client'
import type { StaffFinance } from '@/lib/supabase/types'
import EditableSection from '@/components/ui/EditableSection'
import { Wallet } from 'lucide-react'
import { inputCls, labelCls } from '@/lib/formClasses'

type F = { salary: string; iban: string; currency: string }

export default function StaffFinanceCard({ staffId, initial, canEdit }: { staffId: string; initial: StaffFinance | null; canEdit: boolean }) {
  const supabase = createClient()
  const init: F = { salary: initial?.salary != null ? String(initial.salary) : '', iban: initial?.iban ?? '', currency: initial?.currency ?? 'EUR' }
  return (
    <div className="max-w-xl">
      <EditableSection title="Vencimento" icon={<Wallet size={15} />} canEdit={canEdit} initial={init}
        onSave={async d => { const { error } = await supabase.from('staff_finance').upsert({ staff_id: staffId, salary: d.salary ? Number(d.salary) : null, iban: d.iban || null, currency: d.currency || 'EUR' }, { onConflict: 'staff_id' }); return error ? error.message : null }}>
        {({ editing, value, set }) => editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Vencimento base</label><input type="number" step="0.01" className={inputCls} value={value.salary} onChange={e => set({ salary: e.target.value })} /></div>
            <div><label className={labelCls}>IBAN</label><input className={inputCls} value={value.iban} onChange={e => set({ iban: e.target.value })} /></div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Vencimento base</span><span>{value.salary ? `${value.salary} ${value.currency}` : '—'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">IBAN</span><span>{value.iban || '—'}</span></div>
          </div>
        )}
      </EditableSection>
      <p className="text-xs text-[var(--muted)] mt-3">O histórico de pagamentos liga-se ao módulo de Faturação (em breve).</p>
    </div>
  )
}
