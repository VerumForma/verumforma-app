'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/lib/supabase/types'
import { STATUS_META, DEPARTMENTS, DEPT_LABEL } from '@/lib/team'
import StaffForm from './StaffForm'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, List, LayoutGrid, AlertTriangle } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import { useRowSelection } from '@/lib/useRowSelection'

const inputCls = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type Role = { key: string; label_pt: string }

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}
const emptyDraft: Partial<Staff> = { name: '', status: 'ativo', department: 'construcao', driving_licence: [], skills: [], incomplete: true }

export default function TeamManager({ initial, canEdit, roles }: { initial: Staff[]; canEdit: boolean; roles: Role[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Staff[]>(initial)
  const [editing, setEditing] = useState<Partial<Staff> | null>(null)

  const [q, setQ] = useState('')
  const [fDept, setFDept] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [panel, setPanel] = useState<'filter' | 'sort' | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('list')

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    let out = rows.filter(r => {
      if (fDept !== 'all' && r.department !== fDept) return false
      if (fStatus !== 'all' && r.status !== fStatus) return false
      if (s && ![r.name, r.cargo, r.email].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
    return out
  }, [rows, q, fDept, fStatus])
  const accessors = { name: (r: Staff) => r.name, cargo: (r: Staff) => r.cargo, department: (r: Staff) => DEPT_LABEL[r.department] ?? r.department, email: (r: Staff) => r.email, status: (r: Staff) => r.status }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'name', 'asc', 'equipa')
  const sel = useRowSelection(sorted.map(r => r.id))

  async function refresh() {
    const { data } = await supabase.from('staff').select('*').order('name')
    setRows((data ?? []) as Staff[])
  }
  async function remove(id: string) {
    
    await supabase.from('staff').delete().eq('id', id); refresh()
  }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('staff').delete().in('id', ids); sel.clear(); refresh() }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'
  const Avatar = ({ s }: { s: Staff }) => (
    <span className="w-9 h-9 rounded-full bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-xs font-medium text-[var(--muted)] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover" /> : initials(s.name)}
    </span>
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl mb-1">Equipa</h1>
          <p className="text-sm text-[var(--muted)]">{rows.length} {rows.length === 1 ? 'membro' : 'membros'}{canEdit ? '' : ' · só leitura'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-44 bg-white text-sm pl-8 pr-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]" />
          </div>
          <div className="relative">
            <button onClick={() => setPanel(panel === 'filter' ? null : 'filter')} className={`p-2 border rounded-[3px] ${fDept !== 'all' || fStatus !== 'all' ? 'border-[#1A1A1A]' : 'border-[var(--border)]'} hover:bg-[rgba(26,26,26,0.04)]`}><SlidersHorizontal size={16} /></button>
            {panel === 'filter' && (<>
              <div className="fixed inset-0 z-10" onClick={() => setPanel(null)} />
              <div className="absolute right-0 mt-2 z-20 w-56 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-4 flex flex-col gap-3">
                <div><p className={label}>Departamento</p>
                  <select className={inputCls} value={fDept} onChange={e => setFDept(e.target.value)}>
                    <option value="all">Todos</option>{DEPARTMENTS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </div>
                <div><p className={label}>Estado</p>
                  <select className={inputCls} value={fStatus} onChange={e => setFStatus(e.target.value)}>
                    <option value="all">Todos</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="licenca">De Licença</option>
                  </select>
                </div>
              </div>
            </>)}
          </div>
          <div className="flex border border-[var(--border)] rounded-[3px] overflow-hidden">
            <button onClick={() => setView('list')} className={`p-2 ${view==='list'?'bg-[rgba(26,26,26,0.06)]':''}`}><List size={16} /></button>
            <button onClick={() => setView('grid')} className={`p-2 ${view==='grid'?'bg-[rgba(26,26,26,0.06)]':''}`}><LayoutGrid size={16} /></button>
          </div>
          {canEdit && <button onClick={() => setEditing({ ...emptyDraft })} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Adicionar</button>}
        </div>
      </div>

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="membros" />}

      {view === 'list' ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
              <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}<SortHeader label="Nome" active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')} /><SortHeader label="Cargo" active={sortKey === 'cargo'} dir={sortDir} onClick={() => toggle('cargo')} /><SortHeader label="Departamento" active={sortKey === 'department'} dir={sortDir} onClick={() => toggle('department')} /><SortHeader label="Email" active={sortKey === 'email'} dir={sortDir} onClick={() => toggle('email')} /><SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} />{canEdit && <th className={`${th} text-right`}>Ações</th>}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sorted.length === 0 && <tr><td colSpan={canEdit?7:5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem membros.</td></tr>}
              {sorted.map(row => (
                <tr key={row.id} onClick={() => router.push(`/equipa/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                  <td className={td}><div className="flex items-center gap-3"><Avatar s={row} /><span className="font-medium flex items-center gap-1.5">{row.incomplete && <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-label="Dados incompletos" />}{row.name}</span></div></td>
                  <td className={`${td} text-[var(--muted)]`}>{row.cargo || '—'}</td>
                  <td className={`${td} text-[var(--muted)]`}>{DEPT_LABEL[row.department] ?? row.department}</td>
                  <td className={`${td} text-[var(--muted)]`}>{row.email || '—'}</td>
                  <td className={td}><span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${STATUS_META[row.status]?.cls}`}>{STATUS_META[row.status]?.label}</span></td>
                  {canEdit && <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={e => { e.stopPropagation(); setEditing(row) }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                    <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar este membro?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></ConfirmButton>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(row => (
            <div key={row.id} onClick={() => router.push(`/equipa/${row.id}`)} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5 cursor-pointer hover:border-[#1A1A1A] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Avatar s={row} />
                <div className="min-w-0"><p className="font-medium truncate flex items-center gap-1.5">{row.incomplete && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}{row.name}</p><p className="text-xs text-[var(--muted)] truncate">{row.cargo || '—'}</p></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">{DEPT_LABEL[row.department] ?? row.department}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${STATUS_META[row.status]?.cls}`}>{STATUS_META[row.status]?.label}</span>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-sm text-[var(--muted)] col-span-full">Sem membros.</p>}
        </div>
      )}

      {editing && <StaffForm draft={editing} roles={roles} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    </div>
  )
}
