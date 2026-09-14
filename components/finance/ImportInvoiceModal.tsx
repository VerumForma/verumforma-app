'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseCategory, Expense, Receipt } from '@/lib/supabase/types'
import { VAT_RATES, CURRENCIES, EXPENSE_STATUSES, EXPENSE_STATUS, RECEIPT_STATUSES, RECEIPT_STATUS, vatBreakdown, fmtMoney } from '@/lib/finance'
import { UNITS } from '@/lib/materials'
import { inputCls as input, labelCls as label } from '@/lib/formClasses'
import SearchSelect from '@/components/ui/SearchSelect'
import { uploadAttachments } from './attachmentsHelper'
import { Sparkles, X, UploadCloud, AlertTriangle } from 'lucide-react'

type Ref = { id: string; name: string }
type Step = 'upload' | 'extracting' | 'review' | 'saving'
type Mat = { id: string; code: string | null; name: string; unit: string }
type ExtRef = { material_id: string; supplier_id: string | null; external_ref: string }
type LineMode = 'match' | 'create' | 'ignore'
type Line = { external_ref: string; description: string; quantity: number | null; unit_price: number | null; mode: LineMode; materialId: string; newUnit: string }

type Draft = {
  title: string; counterpartyId: string; reference: string; amount: string; vat_rate: number
  currency: string; issue_date: string; due_date: string; status: string; category_id: string; notes: string
}

const num = (v: unknown): number | null => { const n = Number(v); return isNaN(n) ? null : n }

function resolveLine(it: Record<string, unknown>, supplierId: string, mats: Mat[], refs: ExtRef[]): Line {
  const ext = String(it.external_ref ?? '').trim()
  const desc = String(it.description ?? '').trim()
  let materialId = '', mode: LineMode = 'create'
  if (ext) {
    const low = ext.toLowerCase()
    const scoped = supplierId ? refs.find(r => r.external_ref.toLowerCase() === low && r.supplier_id === supplierId) : undefined
    const any = refs.find(r => r.external_ref.toLowerCase() === low)
    const m = scoped || any
    if (m) { materialId = m.material_id; mode = 'match' }
  }
  if (!materialId && desc) {
    const low = desc.toLowerCase()
    const m = mats.find(mt => mt.name.toLowerCase() === low) || mats.find(mt => mt.name.toLowerCase().includes(low) || low.includes(mt.name.toLowerCase()))
    if (m) { materialId = m.id; mode = 'match' }
  }
  return { external_ref: ext, description: desc, quantity: num(it.quantity), unit_price: num(it.unit_price), mode, materialId, newUnit: 'un' }
}

export default function ImportInvoiceModal({ kind, refs, categories, onClose, onSaved }: {
  kind: 'despesa' | 'recibo'
  refs: Ref[]
  categories: ExpenseCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const isReceipt = kind === 'recibo'
  const [counterparts, setCounterparts] = useState<Ref[]>(refs)
  const [cp, setCp] = useState<{ name: string; nif: string; email: string; phone: string; address: string; city: string; country: string; website: string }>({ name: '', nif: '', email: '', phone: '', address: '', city: '', country: '', website: '' })
  const [creatingCp, setCreatingCp] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const [mats, setMats] = useState<Mat[]>([])
  const [extRefs, setExtRefs] = useState<ExtRef[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [draft, setDraft] = useState<Draft>({
    title: '', counterpartyId: '', reference: '', amount: '', vat_rate: 23,
    currency: 'EUR', issue_date: '', due_date: '', status: isReceipt ? 'issued' : 'paid', category_id: '', notes: '',
  })

  const steps: [string, string][] = [['upload', 'Carregar'], ['extracting', 'A extrair'], ['review', 'Rever'], ['save', 'Ligar & Guardar']]
  const stepIdx = step === 'saving' ? 3 : ['upload', 'extracting', 'review'].indexOf(step)

  function matchRef(name: string): string {
    if (!name) return ''
    const n = name.toLowerCase().trim()
    return counterparts.find(r => { const rn = r.name.toLowerCase(); return rn === n || rn.includes(n) || n.includes(rn) })?.id ?? ''
  }
  function setLine(i: number, patch: Partial<Line>) { setLines(ls => ls.map((l, x) => x === i ? { ...l, ...patch } : l)) }

  async function onFile(f: File, hq = false) {
    setFile(f); setError(''); setStep('extracting')
    try {
      const fd = new FormData(); fd.append('file', f); fd.append('kind', kind); if (hq) fd.append('hq', '1')
      const res = await fetch('/api/import-invoice', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.ok) { setError(json.error || 'Falha na extração.'); setStep('upload'); return }
      const d = json.data as Record<string, unknown>
      const name = String(d.counterparty_name ?? ''), nif = String(d.counterparty_nif ?? '')
      const matched = matchRef(name)
      const vr = Number(d.vat_rate)
      setHint(name && !matched ? `${isReceipt ? 'Cliente' : 'Fornecedor'} "${name}"${nif ? ` (NIF ${nif})` : ''} não foi associado a uma ficha existente — escolhe, cria, ou deixa em branco.` : '')
      setCp({ name, nif, email: String(d.counterparty_email ?? ''), phone: String(d.counterparty_phone ?? ''), address: String(d.counterparty_address ?? ''), city: String(d.counterparty_city ?? ''), country: String(d.counterparty_country ?? ''), website: String(d.counterparty_website ?? '') })
      setDraft({
        title: String(d.description ?? d.reference ?? 'Fatura') || 'Fatura',
        counterpartyId: matched, reference: String(d.reference ?? ''),
        amount: d.amount_total != null ? String(d.amount_total) : '',
        vat_rate: [23, 13, 6, 0].includes(vr) ? vr : 23,
        currency: String(d.currency ?? 'EUR') || 'EUR',
        issue_date: String(d.issue_date ?? ''), due_date: String(d.due_date ?? ''),
        status: isReceipt ? 'issued' : 'paid', category_id: '',
        notes: !matched && (name || nif) ? `${isReceipt ? 'Cliente' : 'Fornecedor'} por associar: ${name}${nif ? ` · NIF ${nif}` : ''}` : '',
      })
      if (!isReceipt) {
        const [{ data: mm }, { data: rr }] = await Promise.all([
          supabase.from('materials').select('id, code, name, unit').is('deleted_at', null),
          supabase.from('material_external_refs').select('material_id, supplier_id, external_ref'),
        ])
        const matsL = (mm ?? []) as Mat[], refsL = (rr ?? []) as ExtRef[]
        setMats(matsL); setExtRefs(refsL)
        const items = Array.isArray(d.items) ? d.items as Record<string, unknown>[] : []
        setLines(items.map(it => resolveLine(it, matched, matsL, refsL)))
      }
      setStep('review')
    } catch {
      setError('Erro inesperado na extração.'); setStep('upload')
    }
  }

  async function createCounterparty() {
    if (!cp.name.trim()) return
    setCreatingCp(true); setError('')
    const base = { name: cp.name.trim(), kind: 'empresa' as const, nif: cp.nif || null, email: cp.email || null, phone: cp.phone || null, address: cp.address || null, city: cp.city || null, country: cp.country || null, website: cp.website || null, incomplete: true }
    const q = isReceipt ? supabase.from('clients').insert(base).select('id, name').single() : supabase.from('suppliers').insert(base).select('id, name').single()
    const { data, error } = await q
    setCreatingCp(false)
    if (error || !data) { setError(error?.message ?? 'Não foi possível criar a ficha.'); return }
    const created = data as { id: string; name: string }
    setCounterparts(cs => [...cs, { id: created.id, name: created.name }].sort((a, b) => a.name.localeCompare(b.name, 'pt')))
    setDraft(d => ({ ...d, counterpartyId: created.id, notes: d.notes.replace(/^(Fornecedor|Cliente) por associar:.*$/m, '').trim() }))
    setHint('')
  }

  async function save() {
    if (!draft.title.trim()) { setError('O título é obrigatório.'); return }
    setStep('saving'); setError('')
    try {
      const amount = Number(draft.amount) || 0
      let id: string
      if (isReceipt) {
        const { data, error } = await supabase.from('receipts').insert({
          title: draft.title.trim(), client_id: draft.counterpartyId || null, status: draft.status as Receipt['status'],
          amount, vat_rate: draft.vat_rate, currency: draft.currency, reference: draft.reference || null,
          issue_date: draft.issue_date || null, notes: draft.notes || null,
        }).select('id').single()
        if (error) throw error; id = (data as { id: string }).id
      } else {
        const { data, error } = await supabase.from('expenses').insert({
          title: draft.title.trim(), supplier_id: draft.counterpartyId || null, category_id: draft.category_id || null,
          status: draft.status as Expense['status'], amount, vat_rate: draft.vat_rate, currency: draft.currency, reference: draft.reference || null,
          issue_date: draft.issue_date || null, due_date: draft.due_date || null, notes: draft.notes || null,
        }).select('id').single()
        if (error) throw error; id = (data as { id: string }).id
      }
      if (file) await uploadAttachments(supabase, isReceipt ? 'receipt' : 'expense', id, [file])

      // Fase B: associar artigos a materiais, memorizar IDs externos, alimentar preços
      if (!isReceipt) {
        const supId = draft.counterpartyId || null
        for (const ln of lines) {
          try {
            if (ln.mode === 'ignore') continue
            let mid = ln.materialId
            if (ln.mode === 'create') {
              const nm = (ln.description || '').trim(); if (!nm) continue
              const { data: created, error } = await supabase.from('materials').insert({ name: nm, unit: ln.newUnit || 'un', current_price: ln.unit_price ?? null }).select('id').single()
              if (error || !created) continue
              mid = (created as { id: string }).id
            }
            if (!mid) continue
            if (ln.external_ref) {
              const exists = extRefs.some(r => r.material_id === mid && r.external_ref.toLowerCase() === ln.external_ref.toLowerCase() && r.supplier_id === supId)
              if (!exists) await supabase.from('material_external_refs').insert({ material_id: mid, supplier_id: supId, external_ref: ln.external_ref })
            }
            if (ln.unit_price != null) {
              await supabase.from('material_prices').insert({ material_id: mid, supplier_id: supId, price: ln.unit_price, source: 'fatura', ...(draft.issue_date ? { price_date: draft.issue_date } : {}) })
              await supabase.from('materials').update({ current_price: ln.unit_price }).eq('id', mid)
            }
          } catch { /* best-effort por linha */ }
        }
      }
      onSaved()
    } catch (e) {
      setStep('review'); setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    }
  }

  const brk = vatBreakdown(Number(draft.amount) || 0, draft.vat_rate)
  const matOpts = mats.map(m => ({ id: m.id, label: `${m.code ? m.code + ' · ' : ''}${m.name}` }))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-[6px] w-full max-w-2xl my-10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-playfair text-2xl flex items-center gap-2"><Sparkles size={20} /> Importar {isReceipt ? 'recibo / fatura' : 'fatura'}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-6 flex-wrap">
          {steps.map(([k, l], i) => (
            <span key={k} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${i <= stepIdx ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[var(--border)]'}`}>{i + 1}</span>
              <span className={i === stepIdx ? 'text-[#1A1A1A] font-medium' : ''}>{l}</span>
              {i < 3 && <span className="text-[var(--border)]">›</span>}
            </span>
          ))}
        </div>

        {step === 'upload' && (
          <>
            <label className="border border-dashed border-[var(--border)] rounded-[6px] p-10 flex flex-col items-center text-center cursor-pointer hover:border-[#1A1A1A] transition-colors">
              <UploadCloud size={28} className="text-[var(--muted)] mb-2" />
              <span className="text-sm font-medium">Carregar PDF, imagem ou fatura digitalizada</span>
              <span className="text-xs text-[var(--muted)] mt-1">PDF, PNG ou JPG — a IA extrai {isReceipt ? 'cliente' : 'fornecedor'}, artigos, valores e datas</span>
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
            </label>
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5"><AlertTriangle size={13} /> Extração por IA — revê sempre antes de guardar.</p>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex justify-end mt-6"><button onClick={onClose} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar — entrada manual</button></div>
          </>
        )}

        {step === 'extracting' && (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--border)] border-t-[#1A1A1A] rounded-full animate-spin mb-3" />
            <p className="text-sm text-[var(--muted)]">A ler a fatura com IA…</p>
          </div>
        )}

        {(step === 'review' || step === 'saving') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {step === 'review' && file && (
              <div className="md:col-span-2 flex justify-end -mb-1">
                <button onClick={() => onFile(file, true)} className="text-xs text-[var(--muted)] hover:text-[#1A1A1A] inline-flex items-center gap-1.5" title="Re-extrair com um modelo melhor (mais caro)"><Sparkles size={12} /> Re-tentar com modelo melhor</button>
              </div>
            )}
            {hint && (
              <div className="md:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-3 py-2 flex items-center justify-between gap-3">
                <span>{hint}</span>
                {cp.name && <button onClick={createCounterparty} disabled={creatingCp} className="shrink-0 text-xs px-3 py-1.5 border border-amber-300 rounded-[3px] bg-white hover:bg-amber-100 disabled:opacity-50">{creatingCp ? 'A criar…' : `Criar ${isReceipt ? 'cliente' : 'fornecedor'}`}</button>}
              </div>
            )}
            <div className="md:col-span-2"><label className={label}>Título</label><input className={input} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
            <div><label className={label}>{isReceipt ? 'Cliente' : 'Fornecedor'}</label><SearchSelect options={counterparts.map(r => ({ id: r.id, label: r.name }))} value={draft.counterpartyId} onChange={id => setDraft({ ...draft, counterpartyId: id })} placeholder="— Nenhum —" /></div>
            <div><label className={label}>Referência</label><input className={input} value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })} /></div>
            <div>
              <label className={label}>Valor total (c/ IVA)</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" className={input} value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} />
                <select className={`${input} w-24`} value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div><label className={label}>Taxa IVA</label><select className={input} value={draft.vat_rate} onChange={e => setDraft({ ...draft, vat_rate: Number(e.target.value) })}>{VAT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select></div>
            {Number(draft.amount) > 0 && <p className="md:col-span-2 -mt-1 text-xs text-[var(--muted)]">Base tributável: <b>{fmtMoney(brk.net, draft.currency)}</b> · IVA: <b>{fmtMoney(brk.vat, draft.currency)}</b></p>}
            <div><label className={label}>Data de emissão</label><input type="date" className={input} value={draft.issue_date} onChange={e => setDraft({ ...draft, issue_date: e.target.value })} /></div>
            {isReceipt ? (
              <div><label className={label}>Estado</label><select className={input} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{RECEIPT_STATUSES.map(s => <option key={s} value={s}>{RECEIPT_STATUS[s].label}</option>)}</select></div>
            ) : (
              <>
                <div><label className={label}>Data limite</label><input type="date" className={input} value={draft.due_date} onChange={e => setDraft({ ...draft, due_date: e.target.value })} /></div>
                <div><label className={label}>Estado</label><select className={input} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{EXPENSE_STATUSES.map(s => <option key={s} value={s}>{EXPENSE_STATUS[s].label}</option>)}</select></div>
                <div><label className={label}>Categoria</label><select className={input} value={draft.category_id} onChange={e => setDraft({ ...draft, category_id: e.target.value })}><option value="">— Nenhuma —</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </>
            )}
            <div className="md:col-span-2"><label className={label}>Notas</label><textarea rows={2} className={input} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>

            {!isReceipt && lines.length > 0 && (
              <div className="md:col-span-2 border-t border-[var(--border)] pt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-1">Artigos da fatura ({lines.length}) — associação a materiais</p>
                <p className="text-xs text-[var(--muted)] mb-3">Ao guardar: o ID externo fica memorizado (fatura → material) e o preço do material é atualizado a partir desta fatura.</p>
                <div className="flex flex-col gap-2.5">
                  {lines.map((ln, i) => (
                    <div key={i} className="border border-[var(--border)] rounded-[4px] p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ln.description || '(sem descrição)'}</p>
                          <p className="text-xs text-[var(--muted)]">{ln.external_ref && <span className="font-mono">{ln.external_ref}</span>}{ln.quantity != null && ` · ${ln.quantity}`}{ln.unit_price != null && ` · ${fmtMoney(ln.unit_price, draft.currency)}/un`}</p>
                        </div>
                        <select value={ln.mode} onChange={e => setLine(i, { mode: e.target.value as LineMode })} className="bg-white text-xs px-2 py-1.5 border border-[var(--border)] rounded-[3px] shrink-0">
                          <option value="match">Associar</option>
                          <option value="create">Criar novo</option>
                          <option value="ignore">Ignorar</option>
                        </select>
                      </div>
                      {ln.mode === 'match' && <SearchSelect options={matOpts} value={ln.materialId} onChange={id => setLine(i, { materialId: id })} placeholder="Escolher material…" />}
                      {ln.mode === 'create' && (
                        <div className="grid grid-cols-3 gap-2">
                          <input className={`${input} col-span-2`} value={ln.description} onChange={e => setLine(i, { description: e.target.value })} placeholder="Nome do novo material" />
                          <select className={input} value={ln.newUnit} onChange={e => setLine(i, { newUnit: e.target.value })}>{UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {file && <p className="md:col-span-2 text-xs text-[var(--muted)]">Anexo: {file.name} (fica ligado ao registo)</p>}
            {error && <p className="md:col-span-2 text-xs text-red-500">{error}</p>}
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button onClick={onClose} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Cancelar</button>
              <button onClick={save} disabled={step === 'saving'} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80 disabled:opacity-50">{step === 'saving' ? 'A guardar…' : 'Guardar'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
