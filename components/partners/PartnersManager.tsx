'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Partner } from '@/lib/supabase/types'
import { STATUS_META, KIND_LABEL, PARTNER_TYPES } from '@/lib/partners'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, Building2, User, X, AlertTriangle } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import { useRowSelection } from '@/lib/useRowSelection'
import LanguageSelect from '@/components/clients/LanguageSelect'

const input =
  'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A] transition-colors'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
const section = 'text-xs uppercase tracking-[0.14em] text-[var(--muted)] border-b border-[var(--border)] pb-2 mb-4'

type Draft = Partial<Partner>
const empty: Draft = { kind: 'empresa', name: '', status: 'ativo', languages: [], incomplete: true }

export default function PartnersManager({ initial, canEdit }: { initial: Partner[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Partner[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState<string>('all')
  const [fTipo, setFTipo] = useState<string>('all')
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null)

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    let out = rows.filter(r => {
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (fTipo !== 'all' && r.kind !== fTipo) return false
      if (s && ![r.name, r.company, r.nif, r.city, r.email].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
    return out
  }, [rows, q, fEstado, fTipo])
  const accessors = { name: (r: Partner) => r.name, email: (r: Partner) => r.email, phone: (r: Partner) => r.phone, kind: (r: Partner) => r.kind, status: (r: Partner) => r.status }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'name', 'asc', 'parceiros')
  const sel = useRowSelection(sorted.map(r => r.id))

  async function refresh() {
    const { data } = await supabase.from('partners').select('*').order('name')
    setRows((data ?? []) as Partner[])
  }

  async function save() {
    if (!draft?.name?.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = {
      kind: draft.kind ?? 'individual',
      name: draft.name!.trim(),
      company: draft.company || null,
      nif: draft.nif || null,
      email: draft.email || null,
      phone: draft.phone || null,
      address: draft.address || null,
      city: draft.city || null,
      country: draft.country || null,
      website: draft.website || null,
      linkedin: draft.linkedin || null,
      instagram: draft.instagram || null,
      facebook: draft.facebook || null,
      x: draft.x || null,
      status: draft.status ?? 'potencial',
      languages: draft.languages ?? [],
      partner_type: draft.partner_type || null,
      incomplete: draft.incomplete ?? false,
      notes: draft.notes || null,
    }
    const { error } = draft.id
      ? await supabase.from('partners').update(payload).eq('id', draft.id)
      : await supabase.from('partners').insert(payload)
    setSaving(false)
    if (error) { setError(error.message); return }
    setDraft(null); refresh()
  }

  async function remove(id: string) {
    
    await supabase.from('partners').delete().eq('id', id); refresh()
  }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('partners').delete().in('id', ids); sel.clear(); refresh() }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl mb-1">Parceiros</h1>
          <p className="text-sm text-[var(--muted)]">{rows.length} {rows.length === 1 ? 'ficha' : 'fichas'}{canEdit ? '' : ' · só leitura'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-48 bg-white text-sm pl-8 pr-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]" />
          </div>

          <div className="relative">
            <button onClick={() => setOpenPanel(openPanel === 'filter' ? null : 'filter')} className={`p-2 border rounded-[3px] ${fEstado !== 'all' || fTipo !== 'all' ? 'border-[#1A1A1A]' : 'border-[var(--border)]'} hover:bg-[rgba(26,26,26,0.04)]`} title="Filtros">
              <SlidersHorizontal size={16} />
            </button>
            {openPanel === 'filter' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenPanel(null)} />
                <div className="absolute right-0 mt-2 z-20 w-56 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-4 flex flex-col gap-3">
                  <div>
                    <p className={label}>Estado</p>
                    <select className={input} value={fEstado} onChange={e => setFEstado(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="potencial">Potencial</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <p className={label}>Tipo</p>
                    <select className={input} value={fTipo} onChange={e => setFTipo(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="individual">Individual</option>
                      <option value="empresa">Empresa</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {canEdit && (
            <button onClick={() => { setDraft({ ...empty }); setError('') }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80">
              <Plus size={15} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="parceiros" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}
              <SortHeader label="Nome" active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')} />
              <SortHeader label="Email" active={sortKey === 'email'} dir={sortDir} onClick={() => toggle('email')} />
              <SortHeader label="Telefone" active={sortKey === 'phone'} dir={sortDir} onClick={() => toggle('phone')} />
              <SortHeader label="Tipo" active={sortKey === 'kind'} dir={sortDir} onClick={() => toggle('kind')} />
              <SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} />
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && (
              <tr><td colSpan={canEdit ? 7 : 5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem parceiros{q || fEstado !== 'all' || fTipo !== 'all' ? ' para este filtro' : ' ainda'}.</td></tr>
            )}
            {sorted.map(row => (
              <tr key={row.id} onClick={() => router.push(`/parceiros/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[3px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]">
                      {row.kind === 'empresa' ? <Building2 size={15} /> : <User size={15} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5">
                        {row.incomplete && <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-label="Dados incompletos" />}
                        <span className="truncate">{row.name}</span>
                      </p>
                      {row.company && <p className="text-xs text-[var(--muted)] truncate">{row.company}</p>}
                    </div>
                  </div>
                </td>
                <td className={`${td} text-[var(--muted)]`}>{row.email || '—'}</td>
                <td className={`${td} text-[var(--muted)]`}>{row.phone || '—'}</td>
                <td className={td}>{KIND_LABEL[row.kind]}</td>
                <td className={td}>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${STATUS_META[row.status]?.cls}`}>{STATUS_META[row.status]?.label}</span>
                </td>
                {canEdit && (
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={e => { e.stopPropagation(); setDraft(row); setError('') }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                    <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar este parceiro?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></ConfirmButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-2xl my-8 p-6 md:p-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Adicionar'} parceiro</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-6"><span className="text-red-500">*</span> Campos obrigatórios</p>

            <p className={section}>Informação básica</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={label}>Nome <span className="text-red-500">*</span></label>
                <input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              {draft.kind === 'empresa' && (
                <div>
                  <label className={label}>Empresa</label>
                  <input className={input} value={draft.company ?? ''} onChange={e => setDraft({ ...draft, company: e.target.value })} />
                </div>
              )}
              <div>
                <label className={label}>Tipo</label>
                <select className={input} value={draft.kind ?? 'individual'} onChange={e => setDraft({ ...draft, kind: e.target.value as Partner['kind'] })}>
                  <option value="individual">Individual</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
              <div>
                <label className={label}>Estado</label>
                <select className={input} value={draft.status ?? 'potencial'} onChange={e => setDraft({ ...draft, status: e.target.value as Partner['status'] })}>
                  <option value="potencial">Potencial</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className={label}>NIF</label>
                <input className={input} value={draft.nif ?? ''} onChange={e => setDraft({ ...draft, nif: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Línguas faladas</label>
                <LanguageSelect value={draft.languages ?? []} onChange={langs => setDraft({ ...draft, languages: langs })} />
              </div>
              <div>
                <label className={label}>Tipo de parceria</label>
                <select className={input} value={draft.partner_type ?? ''} onChange={e => setDraft({ ...draft, partner_type: e.target.value || null })}>
                  <option value="">Selecionar…</option>
                  {PARTNER_TYPES.map(pt => <option key={pt.key} value={pt.key}>{pt.label}</option>)}
                </select>
              </div>
            </div>

            <p className={section}>Informação de contacto</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Email</label>
                <input className={input} value={draft.email ?? ''} onChange={e => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div>
                <label className={label}>Telefone</label>
                <input className={input} value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div>
                <label className={label}>Cidade</label>
                <input className={input} value={draft.city ?? ''} onChange={e => setDraft({ ...draft, city: e.target.value })} />
              </div>
              <div>
                <label className={label}>País</label>
                <input className={input} value={draft.country ?? ''} onChange={e => setDraft({ ...draft, country: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Website</label>
                <input className={input} value={draft.website ?? ''} onChange={e => setDraft({ ...draft, website: e.target.value })} />
              </div>
              <div><label className={label}>LinkedIn</label><input className={input} value={draft.linkedin ?? ''} onChange={e => setDraft({ ...draft, linkedin: e.target.value })} /></div>
              <div><label className={label}>Instagram</label><input className={input} value={draft.instagram ?? ''} onChange={e => setDraft({ ...draft, instagram: e.target.value })} /></div>
              <div><label className={label}>Facebook</label><input className={input} value={draft.facebook ?? ''} onChange={e => setDraft({ ...draft, facebook: e.target.value })} /></div>
              <div><label className={label}>X</label><input className={input} value={draft.x ?? ''} onChange={e => setDraft({ ...draft, x: e.target.value })} /></div>
              <div className="md:col-span-2">
                <label className={label}>Morada</label>
                <input className={input} value={draft.address ?? ''} onChange={e => setDraft({ ...draft, address: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Notas</label>
                <textarea rows={3} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-6 text-sm cursor-pointer">
              <input type="checkbox" checked={!!draft.incomplete} onChange={e => setDraft({ ...draft, incomplete: e.target.checked })} className="accent-amber-500" />
              <span className="inline-flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500" /> Dados incompletos (fica marcado até desmarcares)</span>
            </label>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDraft(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
