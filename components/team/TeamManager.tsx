'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/lib/supabase/types'
import { STATUS_META, DEPARTMENTS, DEPT_LABEL } from '@/lib/team'
import StaffForm from './StaffForm'
import { Search, SlidersHorizontal, ArrowUpDown, Plus, Pencil, Trash2, List, LayoutGrid, AlertTriangle } from 'lucide-react'

const inputCls = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'
type SortKey = 'name' | 'department' | 'hire_date'
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
  const [sortKey, setSortKey] = useState<SortKey>('name')
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
    out = [...out].sort((a, b) => {
      if (sortKey === 'hire_date') return (b.hire_date || '').localeCompare(a.hire_date || '')
      return ((a[sortKey] || '') as string).localeCompare((b[sortKey] || '') as string, 'pt')
    })
    return out
  }, [rows, q, fDept, fStatus, sortKey])

  async function refresh() {
    const { data } = await supabase.from('staff').select('*').order('name')
    setRows((data ?? []) as Staff[])
  }
  async function remove(id: string) {
    if (!confirm('Eliminar este membro?')) return
    await supabase.from('staff').delete().eq('id', id); refresh()
  }

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
          <div className="relative">
            <button onClick={() => setPanel(panel === 'sort' ? null : 'sort')} className="p-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><ArrowUpDown size={16} /></button>
            {panel === 'sort' && (<>
              <div className="fixed inset-0 z-10" onClick={() => setPanel(null)} />
              <div className="absolute right-0 mt-2 z-20 w-52 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] px-2 py-1">Ordenar</p>
                {([['name','Nome'],['department','Departamento'],['hire_date','Data de contratação']] as [SortKey,string][]).map(([k,l]) => (
                  <button key={k} onClick={() => { setSortKey(k); setPanel(null) }} className={`block w-full text-left text-sm px-2 py-1.5 rounded-[3px] hover:bg-[rgba(26,26,26,0.04)] ${sortKey===k?'font-medium':''}`}>{l}</button>
                ))}
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

      {view === 'list' ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
              <tr><th className={th}>Nome</th><th className={th}>Cargo</th><th className={th}>Departamento</th><th className={th}>Email</th><th className={th}>Estado</th>{canEdit && <th className={`${th} text-right`}>Ações</th>}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visible.length === 0 && <tr><td colSpan={canEdit?6:5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Sem membros.</td></tr>}
              {visible.map(row => (
                <tr key={row.id} onClick={() => router.push(`/equipa/${row.id}`)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">
                  <td className={td}><div className="flex items-center gap-3"><Avatar s={row} /><span className="font-medium flex items-center gap-1.5">{row.incomplete && <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-label="Dados incompletos" />}{row.name}</span></div></td>
                  <td className={`${td} text-[var(--muted)]`}>{row.cargo || '—'}</td>
                  <td className={`${td} text-[var(--muted)]`}>{DEPT_LABEL[row.department] ?? row.department}</td>
                  <td className={`${td} text-[var(--muted)]`}>{row.email || '—'}</td>
                  <td className={td}><span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${STATUS_META[row.status]?.cls}`}>{STATUS_META[row.status]?.label}</span></td>
                  {canEdit && <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={e => { e.stopPropagation(); setEditing(row) }} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1"><Pencil size={15} /></button>
                    <button onClick={e => { e.stopPropagation(); remove(row.id) }} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1"><Trash2 size={15} /></button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(row => (
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
          {visible.length === 0 && <p className="text-sm text-[var(--muted)] col-span-full">Sem membros.</p>}
        </div>
      )}

      {editing && <StaffForm draft={editing} roles={roles} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    </div>
  )
}
