'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StaffDocument } from '@/lib/supabase/types'
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'

const CATS: { key: string; label: string }[] = [
  { key: 'cc', label: 'Cartão de Cidadão' },
  { key: 'carta', label: 'Carta de Condução' },
  { key: 'contrato', label: 'Contrato' },
  { key: 'certificado', label: 'Certificado' },
  { key: 'outro', label: 'Outro' },
]
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATS.map(c => [c.key, c.label]))

export default function StaffDocuments({ staffId, initial, canEdit }: { staffId: string; initial: StaffDocument[]; canEdit: boolean }) {
  const supabase = createClient()
  const [rows, setRows] = useState<StaffDocument[]>(initial)
  const [category, setCategory] = useState('cc')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const { data } = await supabase.from('staff_documents').select('*').eq('staff_id', staffId).order('created_at', { ascending: false })
    setRows((data ?? []) as StaffDocument[])
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError('')
    const safe = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `staff/${staffId}/${Date.now()}_${safe}`
    const up = await supabase.storage.from('documents').upload(path, file)
    if (up.error) { setBusy(false); setError(up.error.message); return }
    const { error } = await supabase.from('staff_documents').insert({ staff_id: staffId, name: file.name, category, file_path: path })
    setBusy(false)
    e.target.value = ''
    if (error) { setError(error.message); return }
    refresh()
  }

  async function view(doc: StaffDocument) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function remove(doc: StaffDocument) {
    
    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('staff_documents').delete().eq('id', doc.id)
    refresh()
  }

  return (
    <div>
      {canEdit && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]">
            {CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <label className={`inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-[3px] cursor-pointer ${busy ? 'bg-[rgba(26,26,26,0.4)] text-white' : 'bg-[#1A1A1A] text-white hover:opacity-80'}`}>
            <Upload size={14} /> {busy ? 'A carregar…' : 'Carregar ficheiro'}
            <input type="file" className="hidden" onChange={onFile} disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx" />
          </label>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] divide-y divide-[var(--border)]">
        {rows.length === 0 && <p className="text-sm text-[var(--muted)] p-6">Sem documentos.</p>}
        {rows.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 p-4">
            <FileText size={18} className="text-[var(--muted)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              <p className="text-xs text-[var(--muted)]">{CAT_LABEL[doc.category] ?? doc.category}</p>
            </div>
            <button onClick={() => view(doc)} className="inline-flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline"><ExternalLink size={13} /> Ver</button>
            {canEdit && <ConfirmButton onConfirm={() => remove(doc)} message="Eliminar este documento?" className="text-[var(--muted)] hover:text-red-500 p-1"><Trash2 size={15} /></ConfirmButton>}
          </div>
        ))}
      </div>
    </div>
  )
}
