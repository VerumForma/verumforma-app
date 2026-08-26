'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/lib/supabase/types'
import { DEPARTMENTS, CONTRACT_TYPES, DRIVING_CATEGORIES } from '@/lib/team'
import { X, AlertTriangle } from 'lucide-react'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A] transition-colors'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Role = { key: string; label_pt: string }
type Draft = Partial<Staff>

export default function StaffForm({ draft: initial, roles, onClose, onSaved }: { draft: Draft; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [draft, setDraft] = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const addSkill = () => {
    const v = skillInput.trim()
    if (v && !(draft.skills ?? []).includes(v)) setDraft({ ...draft, skills: [...(draft.skills ?? []), v] })
    setSkillInput('')
  }

  async function save() {
    if (!draft.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = {
      name: draft.name!.trim(),
      email: draft.email || null,
      phone: draft.phone || null,
      role: draft.role || null,
      cargo: draft.cargo || null,
      department: draft.department ?? 'construcao',
      status: draft.status ?? 'ativo',
      hire_date: draft.hire_date || null,
      contract_type: draft.contract_type || null,
      driving_licence: draft.driving_licence ?? [],
      skills: draft.skills ?? [],
      incomplete: draft.incomplete ?? false,
    }
    const { error } = draft.id
      ? await supabase.from('staff').update(payload).eq('id', draft.id)
      : await supabase.from('staff').insert(payload)
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-[6px] w-full max-w-2xl my-8 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Adicionar'} membro</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Nome *</label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
          <div><label className={label}>Cargo</label><input className={input} value={draft.cargo ?? ''} onChange={e => setDraft({ ...draft, cargo: e.target.value })} placeholder="ex. Engenheiro Civil" /></div>
          <div><label className={label}>Perfil de acesso</label>
            <select className={input} value={draft.role ?? ''} onChange={e => setDraft({ ...draft, role: e.target.value || null })}>
              <option value="">Sem conta / a definir</option>
              {roles.map(r => <option key={r.key} value={r.key}>{r.label_pt}</option>)}
            </select>
          </div>
          <div><label className={label}>Departamento</label>
            <select className={input} value={draft.department ?? 'construcao'} onChange={e => setDraft({ ...draft, department: e.target.value })}>
              {DEPARTMENTS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div><label className={label}>Estado</label>
            <select className={input} value={draft.status ?? 'ativo'} onChange={e => setDraft({ ...draft, status: e.target.value as Staff['status'] })}>
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="licenca">De Licença</option>
            </select>
          </div>
          <div><label className={label}>Tipo de contrato</label>
            <select className={input} value={draft.contract_type ?? ''} onChange={e => setDraft({ ...draft, contract_type: e.target.value || null })}>
              <option value="">—</option>
              {CONTRACT_TYPES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div><label className={label}>Email</label><input className={input} value={draft.email ?? ''} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
          <div><label className={label}>Telefone</label><input className={input} value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
          <div><label className={label}>Data de contratação</label><input type="date" className={input} value={draft.hire_date ?? ''} onChange={e => setDraft({ ...draft, hire_date: e.target.value || null })} /></div>
          <div className="md:col-span-2">
            <label className={label}>Carta de condução</label>
            <div className="flex flex-wrap gap-4">
              {DRIVING_CATEGORIES.map(c => (
                <label key={c} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draft.driving_licence?.includes(c) ?? false} onChange={e => { const cur = draft.driving_licence ?? []; setDraft({ ...draft, driving_licence: e.target.checked ? [...cur, c] : cur.filter(x => x !== c) }) }} />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={label}>Competências</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(draft.skills ?? []).map(sk => (
                <span key={sk} className="inline-flex items-center gap-1 text-xs bg-[rgba(26,26,26,0.06)] rounded-[3px] px-2 py-1">{sk}<button type="button" onClick={() => setDraft({ ...draft, skills: (draft.skills ?? []).filter(x => x !== sk) })} className="text-[var(--muted)] hover:text-red-500"><X size={12} /></button></span>
              ))}
            </div>
            <input className={input} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Escreve e Enter para adicionar…" />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-6 text-sm cursor-pointer">
          <input type="checkbox" checked={!!draft.incomplete} onChange={e => setDraft({ ...draft, incomplete: e.target.checked })} className="accent-amber-500" />
          <span className="inline-flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500" /> Dados incompletos (fica marcado até desmarcares)</span>
        </label>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
          <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
