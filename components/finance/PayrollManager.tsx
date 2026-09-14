'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Payroll, PayrollLine, ExpenseCategory, FinanceAttachment } from '@/lib/supabase/types'
import { PAYROLL_STATUS, PAYROLL_STATUSES, PAYROLL_LINE_TYPES, PAYROLL_TYPE_KIND, PAYROLL_TYPE_LABEL, CURRENCIES, fmtMoney, fmtDate, payrollTotals , periodRange, inRange, toCSV, downloadCSV, todayISO} from '@/lib/finance'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import AttachmentsSection from './AttachmentsSection'
import { uploadAttachments, removeAttachment, openFirstAttachment } from './attachmentsHelper'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, X, Sparkles, Paperclip, Download } from 'lucide-react'
import ConfirmButton from '@/components/ui/ConfirmButton'
import SortHeader from '@/components/ui/SortHeader'
import { useTableSort } from '@/lib/useTableSort'
import SelectCheckbox from '@/components/ui/SelectCheckbox'
import SelectionBar from '@/components/ui/SelectionBar'
import RecordView from './RecordView'
import StatusPicker from './StatusPicker'
import { useRowSelection } from '@/lib/useRowSelection'
import PeriodFilter from './PeriodFilter'
import SummaryBar from './SummaryBar'

type Ref = { id: string; name: string }
type LineDraft = { id?: string; kind: 'earning' | 'deduction'; type: string; description: string | null; amount: number }
type Draft = Partial<Payroll> & { lines?: LineDraft[] }
const empty: Draft = { period: '', status: 'draft', currency: 'EUR', lines: [{ kind: 'earning', type: 'base_salary', description: '', amount: 0 }] }

export default function PayrollManager({
  initial, lines, staff, categories, attCounts, canEdit, onImport, toolbarSlot,
}: {
  initial: Payroll[]
  lines: PayrollLine[]
  staff: Ref[]
  categories: ExpenseCategory[]
  attCounts: Record<string, number>
  canEdit: boolean
  onImport: () => void
  toolbarSlot?: HTMLElement | null
}) {
  const supabase = createClient()
  const [rows, setRows] = useState<Payroll[]>(initial)
  const [allLines, setAllLines] = useState<PayrollLine[]>(lines)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [existingAtts, setExistingAtts] = useState<FinanceAttachment[]>([])
  const [pending, setPending] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(false)

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('all')
  const [openFilter, setOpenFilter] = useState(false)
  const [period, setPeriod] = useState('all')
  const [pFrom, setPFrom] = useState('')
  const [pTo, setPTo] = useState('')

  const staffName = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s.name])), [staff])
  const linesByPayroll = useMemo(() => {
    const m: Record<string, PayrollLine[]> = {}
    for (const l of allLines) (m[l.payroll_id] ||= []).push(l)
    return m
  }, [allLines])

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    const range = periodRange(period, pFrom, pTo)
    return rows.filter(r => {
      if (!inRange(r.period ? r.period + '-15' : null, range.from, range.to)) return false
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (s && ![r.period, r.staff_id ? staffName[r.staff_id] : ''].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, q, fEstado, staffName, period, pFrom, pTo])
  const accessors = {
    staff: (r: Payroll) => (r.staff_id ? staffName[r.staff_id] : ''),
    period: (r: Payroll) => r.period,
    gross: (r: Payroll) => payrollTotals((linesByPayroll[r.id] ?? []).map(l => ({ kind: l.kind, amount: l.amount }))).gross,
    net: (r: Payroll) => payrollTotals((linesByPayroll[r.id] ?? []).map(l => ({ kind: l.kind, amount: l.amount }))).net,
    paid: (r: Payroll) => r.paid_date,
    status: (r: Payroll) => PAYROLL_STATUS[r.status]?.label ?? r.status,
  }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'period', 'desc', 'fin_vencimentos')
  const sel = useRowSelection(sorted.map(r => r.id))
  const summary = useMemo(() => {
    let gross = 0, ded = 0, net = 0, paidNet = 0
    for (const r of visible) {
      const t = payrollTotals((linesByPayroll[r.id] ?? []).map(l => ({ kind: l.kind, amount: l.amount })))
      gross += t.gross; ded += t.deductions; net += t.net
      if (r.status === 'paid') paidNet += t.net
    }
    return { gross, ded, net, paidNet, n: visible.length }
  }, [visible, linesByPayroll])
  function exportCSV() {
    const headers = ['Colaborador', 'Período', 'Estado', 'Bruto', 'Deduções', 'Líquido', 'Data pagamento', 'Notas']
    const csvRows = sorted.map(r => {
      const t = payrollTotals((linesByPayroll[r.id] ?? []).map(l => ({ kind: l.kind, amount: l.amount })))
      return [r.staff_id ? staffName[r.staff_id] : '', r.period, PAYROLL_STATUS[r.status]?.label ?? r.status, t.gross.toFixed(2), t.deductions.toFixed(2), t.net.toFixed(2), r.paid_date ?? '', r.notes ?? '']
    })
    downloadCSV(`vencimentos_${todayISO()}.csv`, toCSV(headers, csvRows))
  }

  async function refresh() {
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('payroll').select('*').order('period', { ascending: false }),
      supabase.from('payroll_lines').select('*').order('sort'),
    ])
    setRows((p ?? []) as Payroll[]); setAllLines((l ?? []) as PayrollLine[])
  }

  async function openEdit(row: Payroll, view = false) {
    setReadOnly(view)
    const rl = (linesByPayroll[row.id] ?? []).map(l => ({ id: l.id, kind: l.kind, type: l.type, description: l.description, amount: l.amount }))
    setDraft({ ...row, lines: rl.length ? rl : [{ kind: 'earning', type: 'base_salary', description: '', amount: 0 }] })
    setPending([]); setError('')
    const { data } = await supabase.from('finance_attachments').select('*').eq('entity_type', 'payroll').eq('entity_id', row.id)
    setExistingAtts((data ?? []) as FinanceAttachment[])
  }

  function setLine(i: number, patch: Partial<LineDraft>) {
    setDraft(d => {
      if (!d) return d
      const ls = [...(d.lines ?? [])]
      ls[i] = { ...ls[i], ...patch }
      if (patch.type) ls[i].kind = PAYROLL_TYPE_KIND[patch.type] ?? 'earning'
      return { ...d, lines: ls }
    })
  }
  function addLine() { setDraft(d => d ? { ...d, lines: [...(d.lines ?? []), { kind: 'earning', type: 'base_salary', description: '', amount: 0 }] } : d) }
  function removeLine(i: number) { setDraft(d => d ? { ...d, lines: (d.lines ?? []).filter((_, x) => x !== i) } : d) }

  async function save() {
    if (!draft?.staff_id) { setError('Escolhe o colaborador.'); return }
    if (!draft.period?.trim()) { setError('Indica o período (ex. 2026-03).'); return }
    setSaving(true); setError('')
    const payload = {
      staff_id: draft.staff_id,
      period: draft.period!.trim(),
      status: draft.status ?? 'draft',
      currency: draft.currency ?? 'EUR',
      category_id: draft.category_id || null,
      paid_date: draft.paid_date || null,
      notes: draft.notes || null,
    }
    try {
      let id = draft.id
      if (id) {
        const { error } = await supabase.from('payroll').update(payload).eq('id', id)
        if (error) throw error
        await supabase.from('payroll_lines').delete().eq('payroll_id', id)
      } else {
        const { data, error } = await supabase.from('payroll').insert(payload).select('id').single()
        if (error) throw error
        id = (data as { id: string }).id
      }
      const ls = (draft.lines ?? []).filter(l => l.type)
      if (ls.length) {
        const { error } = await supabase.from('payroll_lines').insert(ls.map((l, idx) => ({
          payroll_id: id!, kind: l.kind, type: l.type, description: l.description || null, amount: Math.abs(Number(l.amount) || 0), sort: idx,
        })))
        if (error) throw error
      }
      if (pending.length) await uploadAttachments(supabase, 'payroll', id!, pending)
      setSaving(false); setDraft(null); refresh()
    } catch (e) {
      setSaving(false); setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    }
  }

  async function remove(id: string) {
    
    await supabase.from('payroll').delete().eq('id', id); refresh()
  }
  async function dropExisting(att: FinanceAttachment) {
    await removeAttachment(supabase, att); setExistingAtts(list => list.filter(a => a.id !== att.id))
  }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('payroll').delete().in('id', ids); sel.clear(); refresh() }
  async function setStatus(id: string, status: string) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, status } as Payroll : r))
    await supabase.from('payroll').update({ status: status as Payroll['status'] }).eq('id', id)
  }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'
  const dt = draft ? payrollTotals((draft.lines ?? []).map(l => ({ kind: l.kind, amount: Number(l.amount) || 0 }))) : null

  return (
    <div className="w-full">
      {toolbarSlot && createPortal(<>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-48 bg-white text-sm pl-8 pr-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]" />
          </div>
          <div className="relative">
            <button onClick={() => setOpenFilter(o => !o)} className={`p-2 border rounded-[3px] ${fEstado !== 'all' ? 'border-[#1A1A1A]' : 'border-[var(--border)]'} hover:bg-[rgba(26,26,26,0.04)]`} title="Filtros"><SlidersHorizontal size={16} /></button>
            {openFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(false)} />
                <div className="absolute left-0 mt-2 z-20 w-56 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-4">
                  <p className={label}>Estado</p>
                  <select className={input} value={fEstado} onChange={e => setFEstado(e.target.value)}>
                    <option value="all">Todos</option>
                    {PAYROLL_STATUSES.map(s => <option key={s} value={s}>{PAYROLL_STATUS[s].label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        <PeriodFilter period={period} from={pFrom} to={pTo} onChange={(pp, f, t) => { setPeriod(pp); setPFrom(f); setPTo(t) }} />
        <button onClick={exportCSV} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]" title="Exportar CSV"><Download size={15} /> CSV</button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={onImport} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><Sparkles size={15} /> Importar</button>
            <button onClick={() => { setDraft({ ...empty, lines: [{ kind: 'earning', type: 'base_salary', description: '', amount: 0 }] }); setReadOnly(false); setExistingAtts([]); setPending([]); setError('') }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Novo vencimento</button>
          </div>
        )}
      </>, toolbarSlot)}

      <SummaryBar items={[
        { label: 'Bruto', value: fmtMoney(summary.gross) },
        { label: 'Deduções', value: fmtMoney(summary.ded), accent: 'red' },
        { label: 'Líquido', value: fmtMoney(summary.net), accent: 'green' },
        { label: 'Pago (líq.)', value: fmtMoney(summary.paidNet), accent: 'green' },
        { label: 'Registos', value: summary.n },
      ]} />

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="vencimentos" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}
              <SortHeader label="Equipa" active={sortKey === 'staff'} dir={sortDir} onClick={() => toggle('staff')} /><SortHeader label="Período" active={sortKey === 'period'} dir={sortDir} onClick={() => toggle('period')} /><SortHeader label="Valor Bruto" align="right" active={sortKey === 'gross'} dir={sortDir} onClick={() => toggle('gross')} />
              <SortHeader label="Valor Líquido" align="right" active={sortKey === 'net'} dir={sortDir} onClick={() => toggle('net')} /><SortHeader label="Data de Pagamento" active={sortKey === 'paid'} dir={sortDir} onClick={() => toggle('paid')} /><SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} />
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && <tr><td colSpan={canEdit ? 8 : 6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Nenhum resultado encontrado.</td></tr>}
            {sorted.map(row => {
              const t = payrollTotals((linesByPayroll[row.id] ?? []).map(l => ({ kind: l.kind, amount: l.amount })))
              return (
                <tr key={row.id} onClick={() => openEdit(row, true)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                  <td className={td}><span className="font-medium flex items-center gap-1.5">{(attCounts[row.id] ?? 0) > 0 && <button type="button" onClick={e => { e.stopPropagation(); openFirstAttachment(supabase, 'payroll', row.id) }} className="text-[var(--muted)] hover:text-[#1A1A1A]" title="Abrir anexo"><Paperclip size={12} /></button>}{row.staff_id ? staffName[row.staff_id] : '—'}</span></td>
                  <td className={`${td} text-[var(--muted)]`}>{row.period}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>{fmtMoney(t.gross, row.currency)}</td>
                  <td className={`${td} text-right font-medium whitespace-nowrap`}>{fmtMoney(t.net, row.currency)}</td>
                  <td className={`${td} text-[var(--muted)] whitespace-nowrap`}>{fmtDate(row.paid_date)}</td>
                  <td className={td}><StatusPicker value={row.status} options={PAYROLL_STATUSES} meta={PAYROLL_STATUS} canEdit={canEdit} onChange={st => setStatus(row.id, st)} /></td>
                  {canEdit && (
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button onClick={() => openEdit(row)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                      <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar este vencimento?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></ConfirmButton>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-2xl my-8 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-2xl">{draft.id ? (readOnly ? 'Ver vencimento' : 'Editar vencimento') : 'Novo vencimento'}</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            {readOnly ? (
              <RecordView atts={existingAtts} notes={draft.notes} rows={[
                { label: 'Colaborador', value: draft.staff_id ? staffName[draft.staff_id] : '—' },
                { label: 'Período', value: draft.period || '—' },
                { label: 'Estado', value: PAYROLL_STATUS[draft.status ?? 'draft']?.label ?? draft.status },
                { label: 'Moeda', value: draft.currency },
                { label: 'Categoria (interna)', value: draft.category_id ? (categories.find(c => c.id === draft.category_id)?.name ?? '—') : '—' },
                { label: 'Data de pagamento', value: fmtDate(draft.paid_date) },
              ]}>
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Linhas</p>
                  <ul className="flex flex-col gap-1.5">
                    {(draft.lines ?? []).map((l, i) => <li key={i} className="flex items-center gap-3 text-sm"><span>{PAYROLL_TYPE_LABEL[l.type] ?? l.type}</span><span className="text-[var(--muted)] truncate">{l.description || ''}</span><span className={`ml-auto font-medium ${l.kind === 'deduction' ? 'text-red-600' : ''}`}>{l.kind === 'deduction' ? '-' : ''}{fmtMoney(Math.abs(Number(l.amount) || 0), draft.currency)}</span></li>)}
                  </ul>
                  {dt && <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)] text-sm"><span className="text-[var(--muted)]">Bruto: <b>{fmtMoney(dt.gross, draft.currency)}</b></span><span className="text-[var(--muted)]">Deduções: <b className="text-red-600">-{fmtMoney(dt.deductions, draft.currency)}</b></span><span className="text-[var(--muted)]">Líquido: <b className="text-green-700">{fmtMoney(dt.net, draft.currency)}</b></span></div>}
                </div>
              </RecordView>
            ) : (<>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Colaborador <span className="text-red-500">*</span></label><SearchSelect options={staff.map(s => ({ id: s.id, label: s.name }))} value={draft.staff_id ?? ''} onChange={id => setDraft({ ...draft, staff_id: id })} placeholder="— Selecionar —" /></div>
              <div><label className={label}>Período <span className="text-red-500">*</span></label><input className={input} value={draft.period ?? ''} onChange={e => setDraft({ ...draft, period: e.target.value })} placeholder="ex. 2026-03" /></div>
              <div><label className={label}>Estado</label>
                <select className={input} value={draft.status ?? 'draft'} onChange={e => setDraft({ ...draft, status: e.target.value as Payroll['status'] })}>
                  {PAYROLL_STATUSES.map(s => <option key={s} value={s}>{PAYROLL_STATUS[s].label}</option>)}
                </select>
              </div>
              <div><label className={label}>Moeda</label>
                <select className={input} value={draft.currency ?? 'EUR'} onChange={e => setDraft({ ...draft, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div><label className={label}>Categoria (interna)</label>
                <select className={input} value={draft.category_id ?? ''} onChange={e => setDraft({ ...draft, category_id: e.target.value || null })}>
                  <option value="">— Nenhuma —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className={label}>Data de pagamento</label><input type="date" className={input} value={draft.paid_date ?? ''} onChange={e => setDraft({ ...draft, paid_date: e.target.value })} /></div>
            </div>

            {/* Linhas */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Linhas do vencimento</p>
                <button onClick={addLine} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><Plus size={13} /> Adicionar linha</button>
              </div>
              <div className="border border-[var(--border)] rounded-[4px] p-3 bg-[rgba(26,26,26,0.02)]">
                <div className="flex flex-col gap-2">
                  {(draft.lines ?? []).map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select className={`${input} w-44`} value={l.type} onChange={e => setLine(i, { type: e.target.value })}>
                        {PAYROLL_LINE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                      <input className={input} placeholder="Descrição" value={l.description ?? ''} onChange={e => setLine(i, { description: e.target.value })} />
                      <input type="number" step="0.01" className={`${input} w-32 text-right ${l.kind === 'deduction' ? 'text-red-600' : ''}`} value={l.amount ?? ''} onChange={e => setLine(i, { amount: e.target.value === '' ? 0 : Number(e.target.value) })} />
                      <button onClick={() => removeLine(i)} className="text-[var(--muted)] hover:text-red-500 shrink-0" title="Remover linha"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                {dt && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-sm">
                    <span className="text-[var(--muted)]">Bruto: <b className="text-[var(--fg,#1A1A1A)]">{fmtMoney(dt.gross, draft.currency)}</b></span>
                    <span className="text-[var(--muted)]">Deduções: <b className="text-red-600">-{fmtMoney(dt.deductions, draft.currency)}</b></span>
                    <span className="text-[var(--muted)]">Líquido: <b className="text-green-700">{fmtMoney(dt.net, draft.currency)}</b></span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <AttachmentsSection existing={existingAtts} onRemoveExisting={dropExisting} pending={pending} onAddPending={fs => setPending(p => [...p, ...fs])} onRemovePending={i => setPending(p => p.filter((_, x) => x !== i))} />
              <div><label className={label}>Notas</label><textarea rows={3} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            </>)}
            <div className="flex justify-end gap-3 mt-6">
              {readOnly ? (<>
                <button onClick={() => setDraft(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Fechar</button>
                {canEdit && <button onClick={() => setReadOnly(false)} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80">Editar</button>}
              </>) : (<>
                <button onClick={() => setDraft(null)} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
                <button onClick={save} disabled={saving} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
