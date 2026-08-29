'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Receipt, CreditNote, FinanceAttachment } from '@/lib/supabase/types'
import { RECEIPT_STATUS, RECEIPT_STATUSES, VAT_RATES, CURRENCIES, fmtMoney, fmtDate, vatBreakdown } from '@/lib/finance'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import AttachmentsSection from './AttachmentsSection'
import { uploadAttachments, removeAttachment } from './attachmentsHelper'
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, X, Sparkles, Paperclip, FileMinus } from 'lucide-react'

type Ref = { id: string; name: string }
type Draft = Partial<Receipt>
const empty: Draft = { title: 'Fatura', status: 'issued', amount: 0, vat_rate: 23, currency: 'EUR' }

export default function ReceiptsManager({
  initial, clients, creditNotes, attCounts, canEdit, onImport,
}: {
  initial: Receipt[]
  clients: Ref[]
  creditNotes: CreditNote[]
  attCounts: Record<string, number>
  canEdit: boolean
  onImport: () => void
}) {
  const supabase = createClient()
  const [rows, setRows] = useState<Receipt[]>(initial)
  const [cnotes, setCnotes] = useState<CreditNote[]>(creditNotes)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [existingAtts, setExistingAtts] = useState<FinanceAttachment[]>([])
  const [pending, setPending] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // credit-note draft (dentro do modal)
  const [cnAmount, setCnAmount] = useState('')
  const [cnReason, setCnReason] = useState('')

  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('all')
  const [openFilter, setOpenFilter] = useState(false)

  const clientName = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c.name])), [clients])
  const cnByReceipt = useMemo(() => {
    const m: Record<string, CreditNote[]> = {}
    for (const c of cnotes) (m[c.receipt_id] ||= []).push(c)
    return m
  }, [cnotes])

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(r => {
      if (fEstado !== 'all' && r.status !== fEstado) return false
      if (s && ![r.title, r.reference, r.client_id ? clientName[r.client_id] : ''].filter(Boolean).join(' ').toLowerCase().includes(s)) return false
      return true
    }).sort((a, b) => (b.issue_date || b.created_at || '').localeCompare(a.issue_date || a.created_at || ''))
  }, [rows, q, fEstado, clientName])

  const open = useMemo(() => rows.filter(r => r.status === 'issued' || r.status === 'overdue')
    .reduce((s, r) => s + (r.amount || 0) - (cnByReceipt[r.id]?.reduce((x, c) => x + (c.amount || 0), 0) ?? 0), 0), [rows, cnByReceipt])

  async function refresh() {
    const [{ data: rec }, { data: cn }] = await Promise.all([
      supabase.from('receipts').select('*').order('issue_date', { ascending: false }),
      supabase.from('credit_notes').select('*'),
    ])
    setRows((rec ?? []) as Receipt[]); setCnotes((cn ?? []) as CreditNote[])
  }

  async function openEdit(row: Receipt) {
    setDraft(row); setPending([]); setError(''); setCnAmount(''); setCnReason('')
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
    if (!confirm('Eliminar este recibo?')) return
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

  const th = 'text-left text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium px-4 py-3'
  const td = 'px-4 py-3 text-sm'
  const brk = draft ? vatBreakdown(Number(draft.amount) || 0, Number(draft.vat_rate ?? 23)) : null
  const draftCns = draft?.id ? (cnByReceipt[draft.id] ?? []) : []

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5 gap-4">
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
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={onImport} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2.5 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]"><Sparkles size={15} /> Importar</button>
            <button onClick={() => { setDraft({ ...empty }); setExistingAtts([]); setPending([]); setError('') }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80"><Plus size={15} /> Novo recibo</button>
          </div>
        )}
      </div>

      <div className="mb-4 bg-[rgba(26,26,26,0.03)] border border-[var(--border)] rounded-[4px] px-4 py-3 text-sm">Recibos em aberto: <b>{fmtMoney(open)}</b></div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgba(26,26,26,0.02)] border-b border-[var(--border)]">
            <tr>
              <th className={th}>Recibo</th><th className={th}>Cliente / Projeto</th><th className={`${th} text-right`}>Valor</th>
              <th className={th}>Data de Emissão</th><th className={th}>Estado</th><th className={`${th} text-center`}>N. Crédito</th>
              {canEdit && <th className={`${th} text-right`}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visible.length === 0 && <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Nenhum resultado encontrado.</td></tr>}
            {visible.map(row => (
              <tr key={row.id} className="hover:bg-[rgba(26,26,26,0.02)]">
                <td className={td}>
                  <p className="font-medium flex items-center gap-1.5">{(attCounts[row.id] ?? 0) > 0 && <Paperclip size={12} className="text-[var(--muted)]" />}{row.title}</p>
                  {row.reference && <p className="text-xs text-[var(--muted)]">Ref: {row.reference}</p>}
                </td>
                <td className={`${td} text-[var(--muted)]`}>{row.client_id ? clientName[row.client_id] : '—'}</td>
                <td className={`${td} text-right font-medium whitespace-nowrap`}>{fmtMoney(row.amount, row.currency)}</td>
                <td className={`${td} text-[var(--muted)] whitespace-nowrap`}>{fmtDate(row.issue_date)}</td>
                <td className={td}><span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${RECEIPT_STATUS[row.status]?.cls}`}>{RECEIPT_STATUS[row.status]?.label}</span></td>
                <td className={`${td} text-center text-[var(--muted)]`}>{cnByReceipt[row.id]?.length ?? 0}</td>
                {canEdit && (
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button onClick={() => openEdit(row)} className="text-[var(--muted)] hover:text-[#1A1A1A] p-1" title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => remove(row.id)} className="text-[var(--muted)] hover:text-red-500 p-1 ml-1" title="Eliminar"><Trash2 size={15} /></button>
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
              <h2 className="font-playfair text-2xl">{draft.id ? 'Editar recibo' : 'Novo recibo'}</h2>
              <button onClick={() => setDraft(null)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={label}>Título <span className="text-red-500">*</span></label><input className={input} value={draft.title ?? ''} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
              <div><label className={label}>Cliente</label><SearchSelect options={clients.map(c => ({ id: c.id, label: c.name }))} value={draft.client_id ?? ''} onChange={id => setDraft({ ...draft, client_id: id })} placeholder="— Nenhum —" /></div>
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
                      <button onClick={() => removeCreditNote(cn.id)} className="text-[var(--muted)] hover:text-red-500" title="Eliminar"><Trash2 size={14} /></button>
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
