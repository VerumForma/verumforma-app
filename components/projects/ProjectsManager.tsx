'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/supabase/types'
import { PROJECT_STATUS, PROJECT_STATUSES } from '@/lib/projects'
import { fmtMoney, fmtDate } from '@/lib/finance'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, X, AlertTriangle, FolderKanban } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import { useRowSelection } from '@/lib/useRowSelection'

type Ref = { id: string; name: string }
type Draft = Partial<Project>
const empty: Draft = { name: '', status: 'adjudicado', incomplete: true }
const section = 'text-xs uppercase tracking-[0.14em] text-[var(--muted)] border-b border-[var(--border)] pb-2 mb-4'

export default function ProjectsManager({ initial, clients, staff, canEdit }: { initial: Project[]; clients: Ref[]; staff: Ref[]; canEdit: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Project[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('all')
  const [openPanel, setOpenPanel] = useState(false)

  const clientName = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c.name])), [clients])

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(r => {
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (s && ![r.name, r.code, r.city, r.client_id ? clientName[r.client_id] : ''].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, q, fEstado, clientName])
  const accessors = {
    code: (r: Project) => r.code,
    name: (r: Project) => r.name,
    client: (r: Project) => (r.client_id ? clientName[r.client_id] : ''),
    status: (r: Project) => PROJECT_STATUS[r.status]?.label ?? r.status,
    budget: (r: Project) => r.budget ?? 0,
    end: (r: Project) => r.end_date,
  }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'code', 'asc', 'projetos')
  const sel = useRowSelection(sorted.map(r => r.id))

  async function refresh() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setRows((data ?? []) as Project[])
  }

  async function save() {
    if (!draft?.name?.trim()) { setError('O nome da obra é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = {
      name: draft.name!.trim(),
      client_id: draft.client_id || null,
      manager_id: draft.manager_id || null,
      status: draft.status ?? 'adjudicado',
      address: draft.address || null,
      city: draft.city || null,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
      completed_date: draft.completed_date || null,
      budget: draft.budget === undefined || draft.budget === null || (draft.budget as unknown) === '' ? null : Number(draft.budget),
      description: draft.description || null,
      incomplete: draft.incomplete ?? false,
    }
    const { error } = draft.id
      ? await supabase.from('projects').update(payload).eq('id', draft.id)
      : await supabase.from('projects').insert(payload)
    setSaving(false)
    if (error) { setError(error.message); return }
    setDraft(null); refresh()
  }

  async function remove(id: string) {
    await supabase.from('projects').delete().eq('id', id); refresh()
  }
  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('projects').delete().in('id', ids); sel.clear(); refresh() }

  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl mb-1">Projetos</h1>
          <p className="text-sm text-[var(--muted)]">{rows.length} {rows.length === 1 ? 'obra' : 'obras'}{canEdit ? '' : ' · só leitura'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-48 bg-white text-sm pl-8 pr-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]" />
          </div>
          <div className="relative">
            <button onClick={() => setOpenPanel(o => !o)} className={`p-2 border rounded-[3px] ${fEstado !== 'all' ? 'border-[#1A1A1A]' : 'border-[var(--border)]'} hover:bg-[rgba(26,26,26,0.04)]`} title="Filtros">
              <SlidersHorizontal size={16} />
            </button>
            {openPanel && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenPanel(false)} />
                <div className="absolute right-0 mt-2 z-20 w-56 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-4">
                  <p className={label}>Estado</p>
                  <select className={input} value={fEstado} onChange={e => setFEstado(e.target.value)}>
                    <option value="all">Todos</option>
                    {PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>)}
                  </select>
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

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="obras" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}
              <SortHeader label="Obra" active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')} />
              <SortHeader label="Cliente" active={sortKey === 'client'} dir={sortDir} onClick={() => toggle('client')} />
              <SortHeader label="Valor adjudicado" align="right" active={sortKey === 'budget'} dir={sortDir} onClick={() => toggle('budget')} />
              <SortHeader label="Prazo" active={sortKey === 'end'} dir={sortDir} onClick={() => toggle('end')} />
              <SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} />
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && (
              <tr><td colSpan={canEdit ? 7 : 5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem obras{q || fEstado !== 'all' ? ' para este filtro' : ' ainda'}.</td></tr>
            )}
            {sorted.map(row => (
              <tr key={row.id} onClick={() => router.push(`/projetos/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[3px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]"><FolderKanban size={15} /></span>
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5">
                        {row.incomplete && <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-label="Dados incompletos" />}
                        <span className="truncate">{row.name}</span>
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate">{row.code}{row.city ? ` · ${row.city}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className={`${td} text-[var(--muted)]`}>{row.client_id ? clientName[row.client_id] : '—'}</td>
                <td className={`${td} text-right font-medium whitespace-nowrap`}>{row.budget != null ? fmtMoney(row.budget) : '—'}</td>
                <td className={`${td} text-[var(--muted)] whitespace-nowrap`}>{fmtDate(row.end_date)}</td>
                <td className={td}>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${PROJECT_STATUS[row.status]?.cls}`}>{PROJECT_STATUS[row.status]?.label}</span>
                </td>
                {canEdit && (
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={e => { e.stopPropagation(); setDraft(row); setError('') }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                    <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar esta obra?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></ConfirmButton>
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
              <h2 className="font-playfair text-2xl">{draft.id ? 'Editar' : 'Adicionar'} obra</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-6"><span className="text-red-500">*</span> Campos obrigatórios</p>

            <p className={section}>Identificação</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2"><label className={label}>Nome da obra <span className="text-red-500">*</span></label><input className={input} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Remodelação — Rua da Palma, 12" /></div>
              <div><label className={label}>Cliente</label><SearchSelect options={clients.map(c => ({ id: c.id, label: c.name }))} value={draft.client_id ?? ''} onChange={id => setDraft({ ...draft, client_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Responsável</label><SearchSelect options={staff.map(s => ({ id: s.id, label: s.name }))} value={draft.manager_id ?? ''} onChange={id => setDraft({ ...draft, manager_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Estado</label>
                <select className={input} value={draft.status ?? 'adjudicado'} onChange={e => setDraft({ ...draft, status: e.target.value as Project['status'] })}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>)}
                </select>
              </div>
              <div><label className={label}>Valor adjudicado (c/ IVA)</label><input type="number" step="0.01" className={input} value={draft.budget ?? ''} onChange={e => setDraft({ ...draft, budget: e.target.value === '' ? null : Number(e.target.value) })} placeholder="€" /></div>
            </div>

            <p className={section}>Localização e prazos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Morada</label><input className={input} value={draft.address ?? ''} onChange={e => setDraft({ ...draft, address: e.target.value })} /></div>
              <div><label className={label}>Cidade</label><input className={input} value={draft.city ?? ''} onChange={e => setDraft({ ...draft, city: e.target.value })} /></div>
              <div />
              <div><label className={label}>Início</label><input type="date" className={input} value={draft.start_date ?? ''} onChange={e => setDraft({ ...draft, start_date: e.target.value })} /></div>
              <div><label className={label}>Prazo previsto</label><input type="date" className={input} value={draft.end_date ?? ''} onChange={e => setDraft({ ...draft, end_date: e.target.value })} /></div>
              <div><label className={label}>Conclusão</label><input type="date" className={input} value={draft.completed_date ?? ''} onChange={e => setDraft({ ...draft, completed_date: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={label}>Descrição</label><textarea rows={3} className={input} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></div>
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
