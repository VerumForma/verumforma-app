'use client'

import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FinanceAttachment } from '@/lib/supabase/types'
import { openAttachment } from './attachmentsHelper'
import { FileText } from 'lucide-react'

type Row = { label: string; value: ReactNode; full?: boolean }

// Ficha só-leitura de um registo financeiro: rótulo + valor (texto), anexos clicáveis e notas.
export default function RecordView({ rows, atts, notes, children }: {
  rows: Row[]; atts?: FinanceAttachment[]; notes?: string | null; children?: ReactNode
}) {
  const supabase = createClient()
  const lbl = 'text-[10px] uppercase tracking-wider text-[var(--muted)] mb-0.5'
  return (
    <div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
        {rows.map((r, i) => (
          <div key={i} className={r.full ? 'md:col-span-2' : ''}>
            <dt className={lbl}>{r.label}</dt>
            <dd className="text-sm">{(r.value === '' || r.value == null) ? '—' : r.value}</dd>
          </div>
        ))}
      </dl>
      {atts && atts.length > 0 && (
        <div className="mt-5">
          <p className={lbl}>Anexos</p>
          <ul className="flex flex-col gap-1.5 mt-1">
            {atts.map(a => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <FileText size={14} className="text-[var(--muted)] shrink-0" />
                <button type="button" onClick={() => openAttachment(supabase, a)} className="text-blue-600 hover:underline truncate">{a.name}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
      {notes && (
        <div className="mt-5">
          <p className={lbl}>Notas</p>
          <p className="text-sm whitespace-pre-wrap mt-1">{notes}</p>
        </div>
      )}
    </div>
  )
}
