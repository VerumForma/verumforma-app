'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, Expense, Receipt } from '@/lib/supabase/types'
import { PROJECT_STATUS, PROJECT_STATUSES } from '@/lib/projects'
import { fmtMoney, fmtDate, EXPENSE_STATUS, RECEIPT_STATUS } from '@/lib/finance'
import EditableSection from '@/components/ui/EditableSection'
import MapsLink from '@/components/ui/MapsLink'
import SearchSelect from '@/components/ui/SearchSelect'
import SummaryBar from '@/components/finance/SummaryBar'
import { inputCls, labelCls } from '@/lib/formClasses'
import {
  ArrowLeft, LayoutGrid, Wallet, Boxes, HardHat, FileText, FolderKanban,
  User, Hash, CircleCheck, MapPin, CalendarDays, Euro, SquareCheckBig, Square, TrendingUp, TrendingDown,
} from 'lucide-react'

type Ref = { id: string; name: string }
type Tab = 'resumo' | 'financas' | 'materiais' | 'equipa' | 'orcamentos'
const rowIcon = 'text-[var(--muted)] shrink-0'

function Wip({ module }: { module: string }) {
  return (
    <div className="relative rounded-[4px] border border-dashed border-[var(--border)] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#1A1A1A 0 8px,transparent 8px 16px)' }} />
      <div className="relative py-14 px-6 text-center"><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] mb-1">Ligação futura</p><p className="text-sm text-[var(--muted)]">Liga-se ao módulo <span className="font-medium">{module}</span> quando o construirmos.</p></div>
    </div>
  )
}
const Row = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm py-0.5"><span className="inline-flex items-center gap-2 text-[var(--muted)]">{icon}{label}</span><span className="text-right">{children}</span></div>
)

export default function ProjectDetail({ project, canEdit, clients, staff, expenses, receipts }: {
  project: Project
  canEdit: boolean
  clients: Ref[]
  staff: Ref[]
  expenses: Expense[]
  receipts: Receipt[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumo')
  const st = PROJECT_STATUS[project.status]

  const clientName = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c.name])), [clients])
  const staffName = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s.name])), [staff])

  const custos = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses])
  const receitas = useMemo(() => receipts.reduce((s, r) => s + (r.amount || 0), 0), [receipts])
  const margem = receitas - custos

  async function toggleIncomplete() { await supabase.from('projects').update({ incomplete: !project.incomplete }).eq('id', project.id); router.refresh() }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; wip?: boolean }[] = [
    { key: 'resumo', label: 'Resumo', icon: <LayoutGrid size={15} /> },
    { key: 'financas', label: 'Finanças', icon: <Wallet size={15} /> },
    { key: 'materiais', label: 'Materiais', icon: <Boxes size={15} />, wip: true },
    { key: 'equipa', label: 'Equipa', icon: <HardHat size={15} />, wip: true },
    { key: 'orcamentos', label: 'Orçamentos', icon: <FileText size={15} />, wip: true },
  ]

  const coreInit = {
    name: project.name,
    status: project.status as string,
    client_id: project.client_id ?? '',
    manager_id: project.manager_id ?? '',
    budget: project.budget != null ? String(project.budget) : '',
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    completed_date: project.completed_date ?? '',
  }
  const locInit = { address: project.address ?? '', city: project.city ?? '', description: project.description ?? '' }

  return (
    <div className="w-full">
      <Link href="/projetos" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Projetos</Link>

      <div className="flex items-center gap-4 mb-6">
        <span className="w-14 h-14 rounded-[8px] bg-[rgba(26,26,26,0.06)] flex items-center justify-center shrink-0 text-[var(--muted)]"><FolderKanban size={24} /></span>
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-3xl leading-tight">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full ${st?.cls}`}><CircleCheck size={12} />{st?.label}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]"><Hash size={13} />{project.code}</span>
            {project.client_id && <span className="text-sm text-[var(--muted)]">· {clientName[project.client_id] ?? '—'}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-2 text-sm px-3.5 py-2.5 -mb-px border-b-2 transition-colors ${tab === t.key ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`}>
            {t.icon}{t.label}{t.wip && <span className="text-[9px] uppercase tracking-wider opacity-70">wip</span>}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditableSection title="Detalhes da obra" icon={<FolderKanban size={15} />} canEdit={canEdit} initial={coreInit}
              onSave={async d => { if (!String(d.name).trim()) return 'O nome é obrigatório.'; const { error } = await supabase.from('projects').update({ name: String(d.name).trim(), status: d.status as Project['status'], client_id: d.client_id || null, manager_id: d.manager_id || null, budget: d.budget === '' ? null : Number(d.budget), start_date: d.start_date || null, end_date: d.end_date || null, completed_date: d.completed_date || null }).eq('id', project.id); if (error) return error.message; router.refresh(); return null }}>
              {({ editing, value, set }) => editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><label className={labelCls}>Nome *</label><input className={inputCls} value={value.name} onChange={e => set({ name: e.target.value })} /></div>
                  <div><label className={labelCls}>Estado</label><select className={inputCls} value={value.status} onChange={e => set({ status: e.target.value })}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>)}</select></div>
                  <div><label className={labelCls}>Valor adjudicado (c/ IVA)</label><input type="number" step="0.01" className={inputCls} value={value.budget} onChange={e => set({ budget: e.target.value })} /></div>
                  <div><label className={labelCls}>Cliente</label><SearchSelect options={clients.map(c => ({ id: c.id, label: c.name }))} value={value.client_id} onChange={id => set({ client_id: id })} placeholder="— Nenhum —" /></div>
                  <div><label className={labelCls}>Responsável</label><SearchSelect options={staff.map(s => ({ id: s.id, label: s.name }))} value={value.manager_id} onChange={id => set({ manager_id: id })} placeholder="— Nenhum —" /></div>
                  <div><label className={labelCls}>Início</label><input type="date" className={inputCls} value={value.start_date} onChange={e => set({ start_date: e.target.value })} /></div>
                  <div><label className={labelCls}>Prazo previsto</label><input type="date" className={inputCls} value={value.end_date} onChange={e => set({ end_date: e.target.value })} /></div>
                  <div><label className={labelCls}>Conclusão</label><input type="date" className={inputCls} value={value.completed_date} onChange={e => set({ completed_date: e.target.value })} /></div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <Row icon={<User size={15} className={rowIcon} />} label="Cliente">{value.client_id ? (clientName[value.client_id] ?? '—') : '—'}</Row>
                  <Row icon={<HardHat size={15} className={rowIcon} />} label="Responsável">{value.manager_id ? (staffName[value.manager_id] ?? '—') : '—'}</Row>
                  <Row icon={<Euro size={15} className={rowIcon} />} label="Valor adjudicado">{value.budget === '' ? '—' : fmtMoney(Number(value.budget))}</Row>
                  <Row icon={<CalendarDays size={15} className={rowIcon} />} label="Início">{fmtDate(value.start_date || null)}</Row>
                  <Row icon={<CalendarDays size={15} className={rowIcon} />} label="Prazo previsto">{fmtDate(value.end_date || null)}</Row>
                  <Row icon={<CircleCheck size={15} className={rowIcon} />} label="Conclusão">{fmtDate(value.completed_date || null)}</Row>
                </div>
              )}
            </EditableSection>

            <EditableSection title="Localização e descrição" icon={<MapPin size={15} />} canEdit={canEdit} initial={locInit}
              onSave={async d => { const { error } = await supabase.from('projects').update({ address: d.address || null, city: d.city || null, description: d.description || null }).eq('id', project.id); if (error) return error.message; router.refresh(); return null }}>
              {({ editing, value, set }) => editing ? (
                <div className="grid grid-cols-1 gap-3">
                  <div><label className={labelCls}>Morada</label><input className={inputCls} value={value.address} onChange={e => set({ address: e.target.value })} /></div>
                  <div><label className={labelCls}>Cidade</label><input className={inputCls} value={value.city} onChange={e => set({ city: e.target.value })} /></div>
                  <div><label className={labelCls}>Descrição</label><textarea rows={4} className={inputCls} value={value.description} onChange={e => set({ description: e.target.value })} /></div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Row icon={<MapPin size={15} className={rowIcon} />} label="Morada"><MapsLink parts={[value.address, value.city]} /></Row>
                  {value.description ? <p className="text-sm text-[var(--muted)] pt-2 whitespace-pre-wrap">{value.description}</p> : <p className="text-sm text-[var(--muted)] pt-2">Sem descrição.</p>}
                </div>
              )}
            </EditableSection>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={toggleIncomplete} disabled={!canEdit} className={`inline-flex items-center gap-2 text-sm ${canEdit ? 'hover:text-[#1A1A1A]' : 'cursor-default'} ${project.incomplete ? 'text-[var(--muted)]' : ''}`}>
              {project.incomplete ? <Square size={20} className="text-[var(--muted)]" /> : <SquareCheckBig size={20} className="text-green-600" />}
              Dados completos
            </button>
            <span className="text-xs text-[var(--muted)]">— {project.incomplete ? 'marca quando estiver tudo preenchido' : 'desmarca se ainda falta informação'}</span>
          </div>
        </div>
      )}

      {tab === 'financas' && (
        <div className="space-y-5">
          <SummaryBar items={[
            { label: 'Valor adjudicado', value: project.budget != null ? fmtMoney(project.budget) : '—' },
            { label: 'Faturado (recibos)', value: fmtMoney(receitas), accent: 'green' },
            { label: 'Custos (despesas)', value: fmtMoney(custos), accent: 'red' },
            { label: 'Margem', value: fmtMoney(margem), accent: margem >= 0 ? 'green' : 'red' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FinTable title="Recibos" icon={<TrendingUp size={15} />} rows={receipts.map(r => ({ id: r.id, title: r.title, ref: r.reference, date: r.issue_date, amount: r.amount, currency: r.currency, badge: RECEIPT_STATUS[r.status]?.label ?? r.status, cls: RECEIPT_STATUS[r.status]?.cls }))} emptyLabel="Sem recibos ligados a esta obra." />
            <FinTable title="Despesas" icon={<TrendingDown size={15} />} rows={expenses.map(e => ({ id: e.id, title: e.title, ref: e.reference, date: e.issue_date, amount: e.amount, currency: e.currency, badge: EXPENSE_STATUS[e.status]?.label ?? e.status, cls: EXPENSE_STATUS[e.status]?.cls }))} emptyLabel="Sem despesas ligadas a esta obra." />
          </div>
          <p className="text-xs text-[var(--muted)]">Liga despesas e recibos a esta obra pelo campo <span className="font-medium">Projeto</span> em Finanças.</p>
        </div>
      )}

      {tab === 'materiais' && <Wip module="Materiais" />}
      {tab === 'equipa' && <Wip module="Equipa" />}
      {tab === 'orcamentos' && <Wip module="Orçamentos" />}
    </div>
  )
}

type FinRow = { id: string; title: string; ref: string | null; date: string | null; amount: number; currency: string; badge: string; cls?: string }
function FinTable({ title, icon, rows, emptyLabel }: { title: string; icon: React.ReactNode; rows: FinRow[]; emptyLabel: string }) {
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0)
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[rgba(26,26,26,0.02)]">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] inline-flex items-center gap-2">{icon}{title}</p>
        <p className="text-sm font-semibold">{fmtMoney(total)}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {rows.map(r => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-[var(--muted)]">{[r.ref ? `Ref: ${r.ref}` : null, fmtDate(r.date)].filter(Boolean).join(' · ')}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] shrink-0 ${r.cls ?? ''}`}>{r.badge}</span>
              <span className="font-medium whitespace-nowrap w-24 text-right">{fmtMoney(r.amount, r.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
