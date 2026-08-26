'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Staff, StaffPersonal, StaffFinance, StaffNotes, StaffCertification, StaffFamily, StaffDocument } from '@/lib/supabase/types'
import { STATUS_META, DEPT_LABEL } from '@/lib/team'
import { ContactBlock, EmploymentBlock, QualificationsBlock } from './StaffOverviewBlocks'
import StaffPersonalCard from './StaffPersonalCard'
import StaffFinanceCard from './StaffFinanceCard'
import StaffNotesCard from './StaffNotesCard'
import StaffCertifications from './StaffCertifications'
import StaffDocuments from './StaffDocuments'
import StaffFamilyComp from './StaffFamily'
import StaffAvatar from './StaffAvatar'
import { buildContactVCard, downloadVCard } from '@/lib/vcard'
import {
  ArrowLeft, Mail, Phone, Download, Briefcase, Building2, CircleCheck,
  LayoutGrid, Files, Wallet, Lock, CalendarClock, FolderKanban, ListChecks,
  Heart, Award, CalendarHeart, Gift, SquareCheckBig, Square,
} from 'lucide-react'

type Role = { key: string; label_pt: string }
type Tab = 'overview' | 'documentos' | 'vencimentos' | 'assiduidade' | 'projetos' | 'tarefas'

function initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') }
function daysUntil(dateStr: string) {
  const d = new Date(dateStr); const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let t = new Date(now.getFullYear(), d.getMonth(), d.getDate())
  if (t < base) t = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate())
  return Math.round((t.getTime() - base.getTime()) / 86400000)
}
function Wip({ module }: { module: string }) {
  return (
    <div className="relative rounded-[4px] border border-dashed border-[var(--border)] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#1A1A1A 0 8px,transparent 8px 16px)' }} />
      <div className="relative py-14 px-6 text-center"><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] mb-1">Ligação futura</p><p className="text-sm text-[var(--muted)]">Liga-se ao módulo <span className="font-medium">{module}</span> quando o construirmos.</p></div>
    </div>
  )
}
function sectionTitle(icon: React.ReactNode, title: string) {
  return <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-3 inline-flex items-center gap-2">{icon}{title}</p>
}
function card(children: React.ReactNode, title: string, icon: React.ReactNode) {
  return <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6">{sectionTitle(icon, title)}{children}</div>
}

type Props = {
  staff: Staff; roleLabel: string | null; roles: Role[]
  personal: StaffPersonal | null; finance: StaffFinance | null; notes: StaffNotes[]
  certs: StaffCertification[]; family: StaffFamily[]; documents: StaffDocument[]
  canEditCore: boolean; canFinance: boolean; canFinanceEdit: boolean
  canPessoal: boolean; canPessoalEdit: boolean; canNotes: boolean; canNotesEdit: boolean; isSelf: boolean
}

const TAB_ICON: Record<Tab, React.ReactNode> = {
  overview: <LayoutGrid size={15} />, documentos: <Files size={15} />, vencimentos: <Wallet size={15} />,
  assiduidade: <CalendarClock size={15} />, projetos: <FolderKanban size={15} />, tarefas: <ListChecks size={15} />,
}
const spanFull = 'lg:col-span-2 xl:col-span-3'

export default function TeamDetail(p: Props) {
  const { staff } = p
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const st = STATUS_META[staff.status]
  const seePessoal = p.canPessoal || p.isSelf
  const seeFinance = p.canFinance || p.isSelf

  async function toggleIncomplete() {
    await supabase.from('staff').update({ incomplete: !staff.incomplete }).eq('id', staff.id)
    router.refresh()
  }
  function saveContact() {
    downloadVCard(`${staff.name}.vcf`, buildContactVCard({ name: staff.name, role: staff.cargo, email: staff.email, phone: staff.phone }, 'VerumForma'))
  }

  const celebrations = seePessoal ? [
    ...(p.personal?.birth_date ? [{ name: `${staff.name} (aniversário)`, date: p.personal.birth_date, kind: 'folga' as const }] : []),
    ...p.family.filter(f => f.birthday && (f.relation === 'conjuge' || f.relation === 'filho')).map(f => ({
      name: `${f.name} (${f.relation === 'conjuge' ? 'cônjuge' : 'filho/a'})`, date: f.birthday!, kind: f.relation === 'conjuge' ? 'folga' as const : 'presente' as const,
    })),
  ].map(c => ({ ...c, days: daysUntil(c.date) })).sort((a, b) => a.days - b.days) : []

  const tabs: { key: Tab; label: string; show: boolean; wip?: boolean }[] = [
    { key: 'overview', label: 'Visão geral', show: true },
    { key: 'documentos', label: 'Documentos', show: seePessoal },
    { key: 'vencimentos', label: 'Vencimentos', show: seeFinance },
    { key: 'assiduidade', label: 'Assiduidade', show: true, wip: true },
    { key: 'projetos', label: 'Projetos', show: true, wip: true },
    { key: 'tarefas', label: 'Tarefas', show: true, wip: true },
  ]

  const qa = 'w-9 h-9 rounded-[8px] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors'

  return (
    <div className="w-full">
      <Link href="/equipa" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Equipa</Link>

      <div className="flex items-center gap-4 mb-6">
        <StaffAvatar staffId={staff.id} name={staff.name} photo={staff.photo} canEdit={p.canEditCore} />
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-3xl leading-tight">{staff.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full ${st?.cls}`}><CircleCheck size={12} />{st?.label}</span>
            {staff.cargo && <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]"><Briefcase size={14} />{staff.cargo}</span>}
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]"><Building2 size={14} />{DEPT_LABEL[staff.department] ?? staff.department}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {staff.email && <a href={`mailto:${staff.email}`} className={qa} aria-label="Enviar email"><Mail size={16} /></a>}
          {staff.phone && <a href={`tel:${staff.phone}`} className={qa} aria-label="Ligar"><Phone size={16} /></a>}
          <button onClick={saveContact} className={qa} aria-label="Guardar contacto"><Download size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 flex-wrap">
        {tabs.filter(t => t.show).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`relative inline-flex items-center gap-2 text-sm px-3.5 py-2.5 -mb-px border-b-2 transition-colors ${tab === t.key ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`}>
            {TAB_ICON[t.key]}{t.label}{t.wip && <span className="text-[9px] uppercase tracking-wider opacity-70">wip</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ContactBlock staff={staff} canEdit={p.canEditCore} />
            <EmploymentBlock staff={staff} canEdit={p.canEditCore} roles={p.roles} />
            {seePessoal && <StaffPersonalCard staffId={staff.id} initial={p.personal} canEdit={p.canPessoalEdit} />}
          </div>

          {seePessoal ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div className="space-y-4">
                <QualificationsBlock staff={staff} canEdit={p.canEditCore} />
                <StaffCertifications staffId={staff.id} initial={p.certs} canEdit={p.canPessoalEdit} />
              </div>
              <div className="space-y-4">
                <StaffFamilyComp staffId={staff.id} initial={p.family} canEdit={p.canPessoalEdit} showGift={p.canPessoal} />
                {celebrations.length > 0 && (
                  <div>{card(
                    <div className="space-y-2">
                      {celebrations.slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-2">{c.kind === 'folga' ? <CalendarHeart size={15} className="text-[var(--muted)]" /> : <Gift size={15} className="text-[var(--muted)]" />}{c.name}</span>
                          <span className="text-[var(--muted)]">{c.days === 0 ? 'hoje' : `em ${c.days}d`} · {c.kind === 'folga' ? 'folga' : 'presente'}</span>
                        </div>
                      ))}
                    </div>, 'Próximas datas a celebrar', <CalendarHeart size={15} />)}</div>
                )}
              </div>
            </div>
          ) : (
            <QualificationsBlock staff={staff} canEdit={p.canEditCore} />
          )}

          {p.canNotes && (
            <div>{sectionTitle(<Lock size={15} />, 'Notas do gestor · privadas (COO/CEO)')}<StaffNotesCard staffId={staff.id} initial={p.notes} canEdit={p.canNotesEdit} /></div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button onClick={toggleIncomplete} disabled={!p.canEditCore} className={`inline-flex items-center gap-2 text-sm ${p.canEditCore ? 'hover:text-[#1A1A1A]' : 'cursor-default'} ${staff.incomplete ? 'text-[var(--muted)]' : ''}`}>
              {staff.incomplete ? <Square size={20} className="text-[var(--muted)]" /> : <SquareCheckBig size={20} className="text-green-600" />}
              Dados completos
            </button>
            <span className="text-xs text-[var(--muted)]">— {staff.incomplete ? 'marca quando estiver tudo preenchido' : 'desmarca se ainda falta informação'}</span>
          </div>
        </div>
      )}

      {tab === 'documentos' && <StaffDocuments staffId={staff.id} initial={p.documents} canEdit={p.canPessoalEdit} />}
      {tab === 'vencimentos' && <StaffFinanceCard staffId={staff.id} initial={p.finance} canEdit={p.canFinanceEdit} />}
      {tab === 'assiduidade' && <Wip module="Assiduidade" />}
      {tab === 'projetos' && <Wip module="Projetos" />}
      {tab === 'tarefas' && <Wip module="Tarefas" />}
    </div>
  )
}
