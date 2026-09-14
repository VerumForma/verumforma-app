'use client'

import { Upload, FileText, Trash2, X } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import { createClient } from '@/lib/supabase/client'
import type { FinanceAttachment } from '@/lib/supabase/types'
import { openAttachment } from './attachmentsHelper'

const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'

export default function AttachmentsSection({
  existing, onRemoveExisting, pending, onAddPending, onRemovePending,
}: {
  existing: FinanceAttachment[]
  onRemoveExisting: (att: FinanceAttachment) => void
  pending: File[]
  onAddPending: (files: File[]) => void
  onRemovePending: (idx: number) => void
}) {
  const supabase = createClient()
  return (
    <div>
      <label className={label}>Anexos</label>
      <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] cursor-pointer hover:bg-[rgba(26,26,26,0.04)]">
        <Upload size={15} /> Carregar ficheiro
        <input type="file" multiple className="hidden" onChange={e => { if (e.target.files) onAddPending(Array.from(e.target.files)); e.target.value = '' }} />
      </label>
      {(existing.length > 0 || pending.length > 0) && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {existing.map(att => (
            <li key={att.id} className="flex items-center gap-2 text-sm">
              <FileText size={14} className="text-[var(--muted)] shrink-0" />
              <button type="button" onClick={() => openAttachment(supabase, att)} className="text-blue-600 hover:underline truncate">{att.name}</button>
              <ConfirmButton onConfirm={() => onRemoveExisting(att)} message="Remover este anexo?" confirmLabel="Remover" className="ml-auto text-[var(--muted)] hover:text-red-500" title="Remover"><Trash2 size={14} /></ConfirmButton>
            </li>
          ))}
          {pending.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <FileText size={14} className="text-amber-500 shrink-0" />
              <span className="truncate">{f.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-600">por guardar</span>
              <button type="button" onClick={() => onRemovePending(i)} className="ml-auto text-[var(--muted)] hover:text-red-500" title="Remover"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
