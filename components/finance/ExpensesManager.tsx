'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseCategory, FinanceAttachment } from '@/lib/supabase/types'
import { EXPENSE_STATUS, EXPENSE_STATUSES, VAT_RATES, CURRENCIES, fmtMoney, fmtDate, vatBreakdown, periodRange, inRange, isExpenseOverdue, toCSV, downloadCSV, todayISO } from '@/lib/finance'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import AttachmentsSection from './AttachmentsSection'
import { uploadAttachments, removeAttachment, openFirstAttachment } from './attachmentsHelper'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, X, Sparkles, Tags, Paperclip, Download } from 'lucide-react'
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
import ImportInvoiceModal from './ImportInvoiceModal'

type Ref = { id: string; name: string }
type Draft = Partial<Expense>
const empty: Draft = { title: '', status: 'paid', amount: 0, vat_rate: 23, currency: 'EUR', internal: false }
const section = 'text-xs uppercase tracking-[0.14em] text-[var(--muted)] border-b border-[var(--border)] pb-2 mb-4'

export default function ExpensesManager({
  initial, suppliers, projects, categories, attCounts, canEdit, onImport, onManageCategories, toolbarSlot,
}: {
  initial: Expense[]
  suppliers: Ref[]
  projects: Ref[]
  categories: ExpenseCategory[]
  attCounts: Record<string, number>
  canEdit: boolean
  onImport: () => void
  onManageCategories: () => void
  toolbarSlot?: HTMLElement | null
}) {
  const supabase = createClient()
  const [rows, setRows] = useState<Expense[]>(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [existingAtts, setExistingAtts] = useState<FinanceAttachment[]>([])
  const [pending, setPending] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(false)

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('all')
  const [fCat, setFCat] = useState('all')
  const [fTipo, setFTipo] = useState('all')
  const [openFilter, setOpenFilter] = useState(false)
  const [period, setPeriod] = useState('all')
  const [pFrom, setPFrom] = useState('')
  const [pTo, setPTo] = useState('')
  const [importing, setImporting] = useState(false)

  const supplierName = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s.name])), [suppliers])
  const projectName = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects])
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    const range = periodRange(period, pFrom, pTo)
    return rows.filter(r => {
      if (!inRange(r.issue_date, range.from, range.to)) return false
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (fCat !== 'all' && r.category_id !== fCat) return false
      if (fTipo === 'internal' && !r.internal) return false
      if (fTipo === 'project' && r.internal) return false
      if (s && ![r.title, r.reference, r.supplier_id ? supplierName[r.supplier_id] : ''].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, q, fEstado, fCat, fTipo, supplierName, period, pFrom, pTo])
  const accessors = {
    title: (r: Expense) => r.title,
    supplier: (r: Expense) => (r.supplier_id ? supplierName[r.supplier_id] : ''),
    category: (r: Expense) => (r.category_id ? catMap[r.category_id]?.name : ''),
    amount: (r: Expense) => r.amount,
    due: (r: Expense) => r.due_date,
    issue: (r: Expense) => r.issue_date,
    status: (r: Expense) => EXPENSE_STATUS[r.status]?.label ?? r.status,
  }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'issue', 'desc', 'fin_despesas')
  const sel = useRowSelection(sorted.map(r => r.id))

  const total = useMemo(() => visible.reduce((s, r) => s + (r.amount || 0), 0), [visible])
  const summary = useMemo(() => {
    let base = 0, iva = 0, pago = 0, overdueSum = 0, overdueN = 0
    for (const r of visible) {
      const b = vatBreakdown(r.amount || 0, r.vat_rate ?? 23); base += b.net; iva += b.vat
      if (r.status === 'paid') pago += r.amount || 0
      if (isExpenseOverdue(r)) { overdueSum += r.amount || 0; overdueN += 1 }
    }
    return { base, iva, pago, overdueSum, overdueN, porPagar: total - pago }
  }, [visible, total])
  function exportCSV() {
    const headers = ['Título', 'Fornecedor', 'Categoria', 'Referência', 'Estado', 'Valor total', 'Taxa IVA %', 'Base s/IVA', 'IVA', 'Emissão', 'Data limite', 'Pagamento', 'Interna', 'Notas']
    const csvRows = sorted.map(r => { const b = vatBreakdown(r.amount || 0, r.vat_rate ?? 23); return [
      r.title, r.supplier_id ? supplierName[r.supplier_id] : '', r.category_id ? (catMap[r.category_id]?.name ?? '') : '', r.reference ?? '',
      isExpenseOverdue(r) ? 'Em Atraso' : (EXPENSE_STATUS[r.status]?.label ?? r.status),
      (r.amount || 0).toFixed(2), r.vat_rate ?? 23, b.net.toFixed(2), b.vat.toFixed(2),
      r.issue_date ?? '', r.due_date ?? '', r.paid_date ?? '', r.internal ? 'Sim' : 'Não', r.notes ?? '',
    ] })
    downloadCSV(`despesas_${todayISO()}.csv`, toCSV(headers, csvRows))
  }

  async function refresh() {
    const { data } = await supabase.from('expenses').select('*').order('issue_date', { ascending: false })
    setRows((data ?? []) as Expense[])
  }

  async function openEdit(row: Expense, view = false) {
    setDraft(row); setReadOnly(view); setPending([]); setError('')
    const { data } = await supabase.from('finance_attachments').select('*').eq('entity_type', 'expense').eq('entity_id', row.id)
    setExistingAtts((data ?? []) as FinanceAttachment[])
  }

  async function save() {
    if (!draft?.title?.trim()) { setError('O título é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = {
      title: draft.title!.trim(),
      supplier_id: draft.supplier_id || null,
      project_id: draft.project_id || null,
      category_id: draft.category_id || null,
      status: draft.status ?? 'pending',
      amount: Number(draft.amount) || 0,
      vat_rate: Number(draft.vat_rate ?? 23),
      currency: draft.currency ?? 'EUR',
      reference: draft.reference || null,
      issue_date: draft.issue_date || null,
      due_date: draft.due_date || null,
      paid_date: draft.paid_date || null,
      internal: !!draft.internal,
      notes: draft.notes || null,
    }
    try {
      let id = draft.id
      if (id) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('expenses').insert(payload).select('id').single()
        if (error) throw error
        id = (data as { id: string }).id
      }
      if (pending.length) await uploadAttachments(supabase, 'expense', id!, pending)
      setSaving(false); setDraft(null); refresh()
    } catch (e) {
      setSaving(false); setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    }
  }

  async function remove(id: string) {
    
    await supabase.from('expenses').delete().eq('id', id); refresh()
  }

  async function dropExisting(att: FinanceAttachment) {
    await removeAttachment(supabase, att)
    setExistingAtts(list => list.filter(a => a.id !== att.id))
  }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('expenses').delete().in('id', ids); sel.clear(); refresh() }
  async function setStatus(id: string, status: string) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, status } as Expense : r))
    await supabase.from('expenses').update({ status: status as Expense['status'] }).eq('id', id)
  }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'
  const brk = draft ? vatBreakdown(Number(draft.amount) || 0, Number(draft.vat_rate ?? 23)) : null

  return (
    <div className="w-full">
      {importing && <ImportInvoiceModal kind="despesa" refs={suppliers} categories={categories} onClose={() => setImporting(false)} onSaved={() => { setImporting(false); refresh() }} />}
      {toolbarSlot && createPortal(<>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar…" className="w-48 bg-white text-sm pl-8 pr-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A]" />
          </div>
          <div className="relative">
            <button onClick={() => setOpenFilter(o => !o)} className={`p-2 border rounded-[3px] ${fEstado !== 'all' || fCat !== 'all' || fTipo !== 'all' ? 'border-[#1A1A1A]' : 'border-[var(--border)]'} hover:bg-[rgba(26,26,26,0.04)]`} title="Filtros"><SlidersHorizontal size={16} /></button>
            {openFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(false)} />
                <div className="absolute left-0 mt-2 z-20 w-56 bg-white border border-[var(--border)] rounded-[4px] shadow-lg p-4 flex flex-col gap-3">
                  <div><p className={label}>Estado</p>
                    <select className={input} value={fEstado} onChange={e => setFEstado(e.target.value)}>
                      <option value="all">Todos</option>
                      {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{EXPENSE_STATUS[s].label}</option>)}
                    </select>
                  </div>
                  <div><p className={label}>Categoria</p>
                    <select className={input} value={fCat} onChange={e => setFCat(e.target.value)}>
                      <option value="all">Todas</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><p className={label}>Tipo</p>
                    <select className={input} value={fTipo} onChange={e => setFTipo(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="internal">Despesa interna</option>
                      <option value="project">Projeto</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <PeriodFilter period={period} from={pFrom} to={pTo} onChange={(p, f, t) => { setPeriod(p); setPFrom(f); setPTo(t) }} />
        <button onClick={exportCSV} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]" title="Exportar CSV"><Download size={15} /> CSV</button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={onManageCategories} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]" title="Categorias"><Tags size={15} /> Categorias</button>
            <button onClick={() => setImporting(true)} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><Sparkles size={15} /> Importar</button>
            <button onClick={() => { setDraft({ ...empty }); setReadOnly(false); setExistingAtts([]); setPending([]); setError('') }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Adicionar despesa</button>
          </div>
        )}
      </>, toolbarSlot)}

      <SummaryBar items={[
        { label: 'Total', value: fmtMoney(total) },
        { label: 'Base s/IVA', value: fmtMoney(summary.base) },
        { label: 'IVA dedutível', value: fmtMoney(summary.iva) },
        { label: 'Pago', value: fmtMoney(summary.pago), accent: 'green' },
        { label: 'Por pagar', value: fmtMoney(summary.porPagar) },
        { label: 'Vencidas', value: `${summary.overdueN} · ${fmtMoney(summary.overdueSum)}`, accent: 'red' },
      ]} />

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="despesas" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}
              <SortHeader label="Despesa" active={sortKey === 'title'} dir={sortDir} onClick={() => toggle('title')} /><SortHeader label="Fornecedor / Projeto" active={sortKey === 'supplier'} dir={sortDir} onClick={() => toggle('supplier')} /><SortHeader label="Categoria" active={sortKey === 'category'} dir={sortDir} onClick={() => toggle('category')} />
              <SortHeader label="Valor" align="right" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggle('amount')} /><SortHeader label="Data Limite" active={sortKey === 'due'} dir={sortDir} onClick={() => toggle('due')} /><SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} />
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && <tr><td colSpan={canEdit ? 8 : 6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Nenhum resultado encontrado.</td></tr>}
            {sorted.map(row => {
              const cat = row.category_id ? catMap[row.category_id] : null
              return (
                <tr key={row.id} onClick={() => openEdit(row, true)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                  <td className={td}>
                    <p className="font-medium flex items-center gap-1.5">{(attCounts[row.id] ?? 0) > 0 && <button type="button" onClick={e => { e.stopPropagation(); openFirstAttachment(supabase, 'expense', row.id) }} className="text-[var(--muted)] hover:text-[#1A1A1A]" title="Abrir anexo"><Paperclip size={12} /></button>}{row.title}</p>
                    {row.reference && <p className="text-xs text-[var(--muted)]">Ref: {row.reference}</p>}
                  </td>
                  <td className={`${td} text-[var(--muted)]`}>{row.supplier_id ? supplierName[row.supplier_id] : (row.project_id ? '' : '—')}{row.project_id && projectName[row.project_id] ? <span className="block text-xs">{projectName[row.project_id]}</span> : null}</td>
                  <td className={td}>{cat ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />{cat.name}</span> : '—'}</td>
                  <td className={`${td} text-right font-medium whitespace-nowrap`}>{fmtMoney(row.amount, row.currency)}</td>
                  <td className={`${td} text-[var(--muted)] whitespace-nowrap`}>{fmtDate(row.due_date)}</td>
                  <td className={td}><StatusPicker value={row.status} options={EXPENSE_STATUSES} meta={EXPENSE_STATUS} canEdit={canEdit} onChange={st => setStatus(row.id, st)} triggerLabel={isExpenseOverdue(row) ? 'Em Atraso' : undefined} triggerCls={isExpenseOverdue(row) ? 'bg-red-100 text-red-800' : undefined} /></td>
                  {canEdit && (
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button onClick={() => openEdit(row)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                      <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar esta despesa?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></ConfirmButton>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          {visible.length > 0 && (
            <tfoot className="border-t border-[var(--border)] bg-[rgba(26,26,26,0.02)]">
              <tr><td className={`${td} text-xs uppercase tracking-wider text-[var(--muted)]`} colSpan={canEdit ? 4 : 3}>Total ({visible.length})</td><td className={`${td} text-right font-semibold`}>{fmtMoney(total)}</td><td colSpan={canEdit ? 3 : 2}></td></tr>
            </tfoot>
          )}
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-2xl my-8 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-2xl">{draft.id ? (readOnly ? 'Ver despesa' : 'Editar despesa') : 'Nova despesa'}</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            {readOnly ? (
              <RecordView atts={existingAtts} notes={draft.notes} rows={[
                { label: 'Título', value: draft.title, full: true },
                { label: 'Fornecedor', value: draft.supplier_id ? supplierName[draft.supplier_id] : '—' },
                { label: 'Projeto / Obra', value: draft.project_id ? (projectName[draft.project_id] ?? '—') : '—' },
                { label: 'Categoria', value: draft.category_id ? (catMap[draft.category_id]?.name ?? '—') : '—' },
                { label: 'Estado', value: EXPENSE_STATUS[draft.status ?? 'pending']?.label ?? draft.status },
                { label: 'Referência / Nº fatura', value: draft.reference || '—' },
                { label: 'Valor total (c/ IVA)', value: fmtMoney(Number(draft.amount) || 0, draft.currency) },
                { label: 'Taxa IVA', value: `${draft.vat_rate ?? 23}%` },
                { label: 'Base tributável', value: fmtMoney(brk?.net ?? 0, draft.currency) },
                { label: 'IVA', value: fmtMoney(brk?.vat ?? 0, draft.currency) },
                { label: 'Data de emissão', value: fmtDate(draft.issue_date) },
                { label: 'Data limite', value: fmtDate(draft.due_date) },
                { label: 'Data de pagamento', value: fmtDate(draft.paid_date) },
                { label: 'Despesa interna', value: draft.internal ? 'Sim' : 'Não' },
              ]} />
            ) : (<>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Título <span className="text-red-500">*</span></label><input className={input} value={draft.title ?? ''} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Descrição da despesa" /></div>
              <div><label className={label}>Fornecedor</label><SearchSelect options={suppliers.map(s => ({ id: s.id, label: s.name }))} value={draft.supplier_id ?? ''} onChange={id => setDraft({ ...draft, supplier_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Projeto / Obra</label><SearchSelect options={projects.map(p => ({ id: p.id, label: p.name }))} value={draft.project_id ?? ''} onChange={id => setDraft({ ...draft, project_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Categoria</label>
                <select className={input} value={draft.category_id ?? ''} onChange={e => setDraft({ ...draft, category_id: e.target.value || null })}>
                  <option value="">— Nenhuma —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className={label}>Estado</label>
                <select className={input} value={draft.status ?? 'pending'} onChange={e => setDraft({ ...draft, status: e.target.value as Expense['status'] })}>
                  {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{EXPENSE_STATUS[s].label}</option>)}
                </select>
              </div>
              <div><label className={label}>Referência / Nº fatura</label><input className={input} value={draft.reference ?? ''} onChange={e => setDraft({ ...draft, reference: e.target.value })} /></div>
              <div>
                <label className={label}>Valor total (c/ IVA)</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" className={input} value={draft.amount ?? ''} onChange={e => setDraft({ ...draft, amount: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  <select className={`${input} w-24`} value={draft.currency ?? 'EUR'} onChange={e => setDraft({ ...draft, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
              </div>
              <div><label className={label}>Taxa IVA</label>
                <select className={input} value={draft.vat_rate ?? 23} onChange={e => setDraft({ ...draft, vat_rate: Number(e.target.value) })}>{VAT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select>
              </div>
              {brk && (Number(draft.amount) > 0) && (
                <p className="md:col-span-2 -mt-1 text-xs text-[var(--muted)]">Base tributável: <b>{fmtMoney(brk.net, draft.currency)}</b> · IVA ({draft.vat_rate}%): <b>{fmtMoney(brk.vat, draft.currency)}</b></p>
              )}
              <div><label className={label}>Data de emissão</label><input type="date" className={input} value={draft.issue_date ?? ''} onChange={e => setDraft({ ...draft, issue_date: e.target.value })} /></div>
              <div><label className={label}>Data limite</label><input type="date" className={input} value={draft.due_date ?? ''} onChange={e => setDraft({ ...draft, due_date: e.target.value })} /></div>
              <div><label className={label}>Data de pagamento</label><input type="date" className={input} value={draft.paid_date ?? ''} onChange={e => setDraft({ ...draft, paid_date: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm mt-6 cursor-pointer"><input type="checkbox" checked={!!draft.internal} onChange={e => setDraft({ ...draft, internal: e.target.checked })} /> Despesa interna</label>
              <div className="md:col-span-2"><AttachmentsSection existing={existingAtts} onRemoveExisting={dropExisting} pending={pending} onAddPending={fs => setPending(p => [...p, ...fs])} onRemovePending={i => setPending(p => p.filter((_, x) => x !== i))} /></div>
              <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={3} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
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
