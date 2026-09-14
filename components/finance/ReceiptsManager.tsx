'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Receipt, CreditNote, FinanceAttachment } from '@/lib/supabase/types'
import { RECEIPT_STATUS, RECEIPT_STATUSES, VAT_RATES, CURRENCIES, fmtMoney, fmtDate, vatBreakdown , periodRange, inRange, toCSV, downloadCSV, todayISO} from '@/lib/finance'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import AttachmentsSection from './AttachmentsSection'
import { uploadAttachments, removeAttachment, openFirstAttachment } from './attachmentsHelper'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, X, Sparkles, Paperclip, FileMinus, Download } from 'lucide-react'
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
type Draft = Partial<Receipt>
const empty: Draft = { title: 'Fatura', status: 'issued', amount: 0, vat_rate: 23, currency: 'EUR' }

export default function ReceiptsManager({
  initial, clients, projects, creditNotes, attCounts, canEdit, onImport, toolbarSlot,
}: {
  initial: Receipt[]
  clients: Ref[]
  projects: Ref[]
  creditNotes: CreditNote[]
  attCounts: Record<string, number>
  canEdit: boolean
  onImport: () => void
  toolbarSlot?: HTMLElement | null
}) {
  const supabase = createClient()
  const [rows, setRows] = useState<Receipt[]>(initial)
  const [cnotes, setCnotes] = useState<CreditNote[]>(creditNotes)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [existingAtts, setExistingAtts] = useState<FinanceAttachment[]>([])
  const [pending, setPending] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(false)
  // credit-note draft (dentro do modal)
  const [cnAmount, setCnAmount] = useState('')
  const [cnReason, setCnReason] = useState('')

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('all')
  const [openFilter, setOpenFilter] = useState(false)
  const [period, setPeriod] = useState('all')
  const [pFrom, setPFrom] = useState('')
  const [pTo, setPTo] = useState('')
  const [importing, setImporting] = useState(false)

  const clientName = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c.name])), [clients])
  const projectName = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects])
  const cnByReceipt = useMemo(() => {
    const m: Record<string, CreditNote[]> = {}
    for (const c of cnotes) (m[c.receipt_id] ||= []).push(c)
    return m
  }, [cnotes])

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    const range = periodRange(period, pFrom, pTo)
    return rows.filter(r => {
      if (!inRange(r.issue_date, range.from, range.to)) return false
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (s && ![r.title, r.reference, r.client_id ? clientName[r.client_id] : ''].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, q, fEstado, clientName, period, pFrom, pTo])
  const accessors = {
    title: (r: Receipt) => r.title,
    client: (r: Receipt) => (r.client_id ? clientName[r.client_id] : ''),
    amount: (r: Receipt) => r.amount,
    issue: (r: Receipt) => r.issue_date,
    status: (r: Receipt) => RECEIPT_STATUS[r.status]?.label ?? r.status,
    credit: (r: Receipt) => (cnByReceipt[r.id]?.length ?? 0),
  }
  const { sorted, sortKey, sortDir, toggle } = useTableSort(visible, accessors, 'issue', 'desc', 'fin_recibos')
  const sel = useRowSelection(sorted.map(r => r.id))

  const open = useMemo(() => rows.filter(r => r.status === 'issued' || r.status === 'overdue')
    .reduce((s, r) => s + (r.amount || 0) - (cnByReceipt[r.id]?.reduce((x, c) => x + (c.amount || 0), 0) ?? 0), 0), [rows, cnByReceipt])
  const total = useMemo(() => visible.reduce((s, r) => s + (r.amount || 0), 0), [visible])
  const summary = useMemo(() => {
    let base = 0, iva = 0, recebido = 0, emAberto = 0, cnSum = 0, cnN = 0
    for (const r of visible) {
      const b = vatBreakdown(r.amount || 0, r.vat_rate ?? 23); base += b.net; iva += b.vat
      if (r.status === 'paid') recebido += r.amount || 0
      const cn = cnByReceipt[r.id]?.reduce((x, c) => x + (c.amount || 0), 0) ?? 0
      cnSum += cn; cnN += cnByReceipt[r.id]?.length ?? 0
      if (r.status === 'issued' || r.status === 'overdue') emAberto += (r.amount || 0) - cn
    }
    return { base, iva, recebido, emAberto, cnSum, cnN }
  }, [visible, cnByReceipt])
  function exportCSV() {
    const headers = ['Título', 'Cliente', 'Referência', 'Estado', 'Valor total', 'Taxa IVA %', 'Base s/IVA', 'IVA', 'Emissão', 'Pagamento', 'Notas Crédito', 'Notas']
    const csvRows = sorted.map(r => { const b = vatBreakdown(r.amount || 0, r.vat_rate ?? 23); return [
      r.title, r.client_id ? clientName[r.client_id] : '', r.reference ?? '', RECEIPT_STATUS[r.status]?.label ?? r.status,
      (r.amount || 0).toFixed(2), r.vat_rate ?? 23, b.net.toFixed(2), b.vat.toFixed(2),
      r.issue_date ?? '', r.paid_date ?? '', cnByReceipt[r.id]?.length ?? 0, r.notes ?? '',
    ] })
    downloadCSV(`recibos_${todayISO()}.csv`, toCSV(headers, csvRows))
  }

  async function refresh() {
    const [{ data: rec }, { data: cn }] = await Promise.all([
      supabase.from('receipts').select('*').order('issue_date', { ascending: false }),
      supabase.from('credit_notes').select('*'),
    ])
    setRows((rec ?? []) as Receipt[]); setCnotes((cn ?? []) as CreditNote[])
  }

  async function openEdit(row: Receipt, view = false) {
    setDraft(row); setReadOnly(view); setPending([]); setError(''); setCnAmount(''); setCnReason('')
    const { data } = await supabase.from('finance_attachments').select('*').eq('entity_type', 'receipt').eq('entity_id', row.id)
    setExistingAtts((data ?? []) as FinanceAttachment[])
  }

  async function save() {
    if (!draft?.title?.trim()) { setError('O título é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = {
      title: draft.title!.trim(),
      client_id: draft.client_id || null,
      project_id: draft.project_id || null,
      status: draft.status ?? 'issued',
      amount: Number(draft.amount) || 0,
      vat_rate: Number(draft.vat_rate ?? 23),
      currency: draft.currency ?? 'EUR',
      reference: draft.reference || null,
      issue_date: draft.issue_date || null,
      paid_date: draft.paid_date || null,
      notes: draft.notes || null,
    }
    try {
      let id = draft.id
      if (id) {
        const { error } = await supabase.from('receipts').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('receipts').insert(payload).select('id').single()
        if (error) throw error
        id = (data as { id: string }).id
      }
      if (pending.length) await uploadAttachments(supabase, 'receipt', id!, pending)
      setSaving(false); setDraft(null); refresh()
    } catch (e) {
      setSaving(false); setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    }
  }

  async function remove(id: string) {
    
    await supabase.from('receipts').delete().eq('id', id); refresh()
  }

  async function dropExisting(att: FinanceAttachment) {
    await removeAttachment(supabase, att); setExistingAtts(list => list.filter(a => a.id !== att.id))
  }

  async function addCreditNote() {
    if (!draft?.id) { setError('Guarda o recibo antes de adicionar notas de crédito.'); return }
    const amt = Number(cnAmount)
    if (!amt) return
    const { error } = await supabase.from('credit_notes').insert({ receipt_id: draft.id, amount: amt, reason: cnReason || null })
    if (error) { setError(error.message); return }
    setCnAmount(''); setCnReason(''); refresh()
  }
  async function removeCreditNote(id: string) {
    await supabase.from('credit_notes').delete().eq('id', id); refresh()
  }

  async function bulkDelete() { const ids = sel.selectedIds(); if (!ids.length) return; await supabase.from('receipts').delete().in('id', ids); sel.clear(); refresh() }
  async function setStatus(id: string, status: string) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, status } as Receipt : r))
    await supabase.from('receipts').update({ status: status as Receipt['status'] }).eq('id', id)
  }
  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'
  const brk = draft ? vatBreakdown(Number(draft.amount) || 0, Number(draft.vat_rate ?? 23)) : null
  const draftCns = draft?.id ? (cnByReceipt[draft.id] ?? []) : []

  return (
    <div className="w-full">
      {importing && <ImportInvoiceModal kind="recibo" refs={clients} categories={[]} onClose={() => setImporting(false)} onSaved={() => { setImporting(false); refresh() }} />}
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
                    {RECEIPT_STATUSES.map(s => <option key={s} value={s}>{RECEIPT_STATUS[s].label}</option>)}
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
            <button onClick={() => setImporting(true)} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><Sparkles size={15} /> Importar</button>
            <button onClick={() => { setDraft({ ...empty }); setReadOnly(false); setExistingAtts([]); setPending([]); setError('') }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Novo recibo</button>
          </div>
        )}
      </>, toolbarSlot)}

      <SummaryBar items={[
        { label: 'Faturado', value: fmtMoney(total) },
        { label: 'Base s/IVA', value: fmtMoney(summary.base) },
        { label: 'IVA liquidado', value: fmtMoney(summary.iva) },
        { label: 'Recebido', value: fmtMoney(summary.recebido), accent: 'green' },
        { label: 'Em aberto', value: fmtMoney(summary.emAberto), accent: 'amber' },
        { label: 'Notas de crédito', value: `${summary.cnN} · ${fmtMoney(summary.cnSum)}` },
      ]} />

      {canEdit && <SelectionBar count={sel.count} onClear={sel.clear} onDelete={bulkDelete} noun="recibos" />}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>{canEdit && <th className="px-4 py-3 w-10"><SelectCheckbox checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} ariaLabel="Selecionar todos" /></th>}
              <SortHeader label="Recibo" active={sortKey === 'title'} dir={sortDir} onClick={() => toggle('title')} /><SortHeader label="Cliente / Projeto" active={sortKey === 'client'} dir={sortDir} onClick={() => toggle('client')} /><SortHeader label="Valor" align="right" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggle('amount')} />
              <SortHeader label="Data de Emissão" active={sortKey === 'issue'} dir={sortDir} onClick={() => toggle('issue')} /><SortHeader label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')} /><SortHeader label="N. Crédito" align="center" active={sortKey === 'credit'} dir={sortDir} onClick={() => toggle('credit')} />
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.length === 0 && <tr><td colSpan={canEdit ? 8 : 6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Nenhum resultado encontrado.</td></tr>}
            {sorted.map(row => (
              <tr key={row.id} onClick={() => openEdit(row, true)} className="hover:bg-[rgba(26,26,26,0.02)] cursor-pointer">{canEdit && <td className={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.isSelected(row.id)} onChange={e => sel.toggle(row.id, (e.nativeEvent as MouseEvent).shiftKey)} className="accent-[#1A1A1A] cursor-pointer align-middle" aria-label="Selecionar" /></td>}
                <td className={td}>
                  <p className="font-medium flex items-center gap-1.5">{(attCounts[row.id] ?? 0) > 0 && <button type="button" onClick={e => { e.stopPropagation(); openFirstAttachment(supabase, 'receipt', row.id) }} className="text-[var(--muted)] hover:text-[#1A1A1A]" title="Abrir anexo"><Paperclip size={12} /></button>}{row.title}</p>
                  {row.reference && <p className="text-xs text-[var(--muted)]">Ref: {row.reference}</p>}
                </td>
                <td className={`${td} text-[var(--muted)]`}>{row.client_id ? clientName[row.client_id] : (row.project_id ? '' : '—')}{row.project_id && projectName[row.project_id] ? <span className="block text-xs">{projectName[row.project_id]}</span> : null}</td>
                <td className={`${td} text-right font-medium whitespace-nowrap`}>{fmtMoney(row.amount, row.currency)}</td>
                <td className={`${td} text-[var(--muted)] whitespace-nowrap`}>{fmtDate(row.issue_date)}</td>
                <td className={td}><StatusPicker value={row.status} options={RECEIPT_STATUSES} meta={RECEIPT_STATUS} canEdit={canEdit} onChange={st => setStatus(row.id, st)} /></td>
                <td className={`${td} text-center text-[var(--muted)]`}>{cnByReceipt[row.id]?.length ?? 0}</td>
                {canEdit && (
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={() => openEdit(row)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                    <ConfirmButton stop onConfirm={() => remove(row.id)} message="Eliminar este recibo?" className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></ConfirmButton>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-2xl">{draft.id ? (readOnly ? 'Ver recibo' : 'Editar recibo') : 'Novo recibo'}</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            {readOnly ? (
              <RecordView atts={existingAtts} notes={draft.notes} rows={[
                { label: 'Título', value: draft.title, full: true },
                { label: 'Cliente', value: draft.client_id ? clientName[draft.client_id] : '—' },
                { label: 'Projeto / Obra', value: draft.project_id ? (projectName[draft.project_id] ?? '—') : '—' },
                { label: 'Estado', value: RECEIPT_STATUS[draft.status ?? 'issued']?.label ?? draft.status },
                { label: 'Referência / Nº fatura', value: draft.reference || '—' },
                { label: 'Valor total (c/ IVA)', value: fmtMoney(Number(draft.amount) || 0, draft.currency) },
                { label: 'Taxa IVA', value: `${draft.vat_rate ?? 23}%` },
                { label: 'Base tributável', value: fmtMoney(brk?.net ?? 0, draft.currency) },
                { label: 'IVA', value: fmtMoney(brk?.vat ?? 0, draft.currency) },
                { label: 'Data de emissão', value: fmtDate(draft.issue_date) },
                { label: 'Data de pagamento', value: fmtDate(draft.paid_date) },
              ]}>
                {draftCns.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Notas de crédito</p>
                    <ul className="flex flex-col gap-1.5">
                      {draftCns.map(cn => <li key={cn.id} className="flex items-center gap-3 text-sm"><span className="font-medium">{fmtMoney(cn.amount)}</span><span className="text-[var(--muted)] truncate">{cn.reason || '—'}</span><span className="text-xs text-[var(--muted)] ml-auto whitespace-nowrap">{fmtDate(cn.issue_date)}</span></li>)}
                    </ul>
                  </div>
                )}
              </RecordView>
            ) : (<>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Título <span className="text-red-500">*</span></label><input className={input} value={draft.title ?? ''} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
              <div><label className={label}>Cliente</label><SearchSelect options={clients.map(c => ({ id: c.id, label: c.name }))} value={draft.client_id ?? ''} onChange={id => setDraft({ ...draft, client_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Projeto / Obra</label><SearchSelect options={projects.map(p => ({ id: p.id, label: p.name }))} value={draft.project_id ?? ''} onChange={id => setDraft({ ...draft, project_id: id })} placeholder="— Nenhum —" /></div>
              <div><label className={label}>Estado</label>
                <select className={input} value={draft.status ?? 'issued'} onChange={e => setDraft({ ...draft, status: e.target.value as Receipt['status'] })}>
                  {RECEIPT_STATUSES.map(s => <option key={s} value={s}>{RECEIPT_STATUS[s].label}</option>)}
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
              <div><label className={label}>Data de pagamento</label><input type="date" className={input} value={draft.paid_date ?? ''} onChange={e => setDraft({ ...draft, paid_date: e.target.value })} /></div>
              <div className="md:col-span-2"><AttachmentsSection existing={existingAtts} onRemoveExisting={dropExisting} pending={pending} onAddPending={fs => setPending(p => [...p, ...fs])} onRemovePending={i => setPending(p => p.filter((_, x) => x !== i))} /></div>
              <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={3} className={input} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
            </div>

            {/* Notas de crédito */}
            <div className="mt-6 pt-5 border-t border-[var(--border)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-3 flex items-center gap-2"><FileMinus size={14} /> Notas de crédito</p>
              {!draft.id && <p className="text-xs text-[var(--muted)] mb-3">Guarda o recibo primeiro para lhe associar notas de crédito.</p>}
              {draftCns.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {draftCns.map(cn => (
                    <li key={cn.id} className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{fmtMoney(cn.amount)}</span>
                      <span className="text-[var(--muted)] truncate">{cn.reason || '—'}</span>
                      <span className="text-xs text-[var(--muted)] ml-auto whitespace-nowrap">{fmtDate(cn.issue_date)}</span>
                      <ConfirmButton onConfirm={() => removeCreditNote(cn.id)} message="Eliminar esta nota de crédito?" className="text-[var(--muted)] hover:text-red-500" title="Eliminar"><Trash2 size={14} /></ConfirmButton>
                    </li>
                  ))}
                </ul>
              )}
              {draft.id && (
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Valor" className={`${input} w-32`} value={cnAmount} onChange={e => setCnAmount(e.target.value)} />
                  <input placeholder="Motivo" className={input} value={cnReason} onChange={e => setCnReason(e.target.value)} />
                  <button onClick={addCreditNote} className="text-sm px-4 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)] whitespace-nowrap">Adicionar</button>
                </div>
              )}
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
