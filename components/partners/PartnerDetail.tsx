'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Partner, PartnerContact } from '@/lib/supabase/types'
import { STATUS_META, KIND_LABEL, PARTNER_TYPES, PARTNER_TYPE_LABEL } from '@/lib/partners'
import EntityAvatar from '@/components/ui/EntityAvatar'
import EditableSection from '@/components/ui/EditableSection'
import LanguageSelect from '@/components/clients/LanguageSelect'
import PartnerContacts from './PartnerContacts'
import { buildEntityVCard, downloadVCard } from '@/lib/vcard'
import { inputCls, labelCls } from '@/lib/formClasses'
import {
  ArrowLeft, Mail, Phone, Download, Building2, User, CircleCheck, Globe,
  Linkedin, Instagram, Facebook, Twitter, Contact, Tag, Hash, MapPin, Handshake, Languages,
  LayoutGrid, FolderKanban, FileText, Wallet, SquareCheckBig, Square,
} from 'lucide-react'

type Tab = 'overview' | 'projetos' | 'orcamentos' | 'financas'
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

export default function PartnerDetail({ partner, canEdit, initialContacts }: { partner: Partner; canEdit: boolean; initialContacts: PartnerContact[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const st = STATUS_META[partner.status]
  const isCompany = partner.kind === 'empresa'
  const added = new Date(partner.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  const ptype = partner.partner_type ? (PARTNER_TYPE_LABEL[partner.partner_type] ?? partner.partner_type) : null
  const handle = (v: string, base: string) => v.startsWith('http') ? v : `${base}${v.replace(/^@/, '')}`
  async function toggleIncomplete() { await supabase.from('partners').update({ incomplete: !partner.incomplete }).eq('id', partner.id); router.refresh() }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Visão geral', icon: <LayoutGrid size={15} /> },
    { key: 'projetos', label: 'Projetos', icon: <FolderKanban size={15} /> },
    { key: 'orcamentos', label: 'Orçamentos', icon: <FileText size={15} /> },
    { key: 'financas', label: 'Finanças', icon: <Wallet size={15} /> },
  ]
  const qa = 'w-9 h-9 rounded-[8px] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors'

  const contactInit = { email: partner.email ?? '', phone: partner.phone ?? '', website: partner.website ?? '', linkedin: partner.linkedin ?? '', instagram: partner.instagram ?? '', facebook: partner.facebook ?? '', x: partner.x ?? '' }
  const bizInit = { name: partner.name, company: partner.company ?? '', nif: partner.nif ?? '', kind: partner.kind as string, status: partner.status as string, partner_type: partner.partner_type ?? '', address: partner.address ?? '', city: partner.city ?? '', country: partner.country ?? '', languages: partner.languages ?? [] as string[] }

  return (
    <div className="w-full">
      <Link href="/parceiros" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-4"><ArrowLeft size={16} /> Parceiros</Link>

      <div className="flex items-center gap-4 mb-6">
        <EntityAvatar name={partner.name} photo={partner.photo} canEdit={canEdit} pathPrefix={`partners/${partner.id}`} onSaved={async url => { await supabase.from('partners').update({ photo: url }).eq('id', partner.id); router.refresh() }} />
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-3xl leading-tight">{partner.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full ${st?.cls}`}><CircleCheck size={12} />{st?.label}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">{isCompany ? <Building2 size={14} /> : <User size={14} />}{KIND_LABEL[partner.kind]}</span>
            {ptype && <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]"><Handshake size={14} />{ptype}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {partner.email && <a href={`mailto:${partner.email}`} className={qa} aria-label="Enviar email"><Mail size={16} /></a>}
          {partner.phone && <a href={`tel:${partner.phone.replace(/\s+/g, '')}`} className={qa} aria-label="Ligar"><Phone size={16} /></a>}
          <button onClick={() => downloadVCard(`${partner.name}.vcf`, buildEntityVCard(partner))} className={qa} aria-label="Guardar contacto"><Download size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-2 text-sm px-3.5 py-2.5 -mb-px border-b-2 transition-colors ${tab === t.key ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`}>
            {t.icon}{t.label}{t.key !== 'overview' && <span className="text-[9px] uppercase tracking-wider opacity-70">wip</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditableSection title="Contacto" icon={<Contact size={15} />} canEdit={canEdit} initial={contactInit}
              onSave={async d => { const { error } = await supabase.from('partners').update({ email: d.email || null, phone: d.phone || null, website: d.website || null, linkedin: d.linkedin || null, instagram: d.instagram || null, facebook: d.facebook || null, x: d.x || null }).eq('id', partner.id); if (error) return error.message; router.refresh(); return null }}>
              {({ editing, value, set }) => editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={value.email} onChange={e => set({ email: e.target.value })} /></div>
                  <div><label className={labelCls}>Telefone</label><input className={inputCls} value={value.phone} onChange={e => set({ phone: e.target.value })} /></div>
                  <div><label className={labelCls}>Website</label><input className={inputCls} value={value.website} onChange={e => set({ website: e.target.value })} /></div>
                  <div><label className={labelCls}>LinkedIn</label><input className={inputCls} value={value.linkedin} onChange={e => set({ linkedin: e.target.value })} /></div>
                  <div><label className={labelCls}>Instagram</label><input className={inputCls} value={value.instagram} onChange={e => set({ instagram: e.target.value })} /></div>
                  <div><label className={labelCls}>Facebook</label><input className={inputCls} value={value.facebook} onChange={e => set({ facebook: e.target.value })} /></div>
                  <div><label className={labelCls}>X</label><input className={inputCls} value={value.x} onChange={e => set({ x: e.target.value })} /></div>
                </div>
              ) : (() => {
                const rows = [
                  { icon: <Mail size={15} className={rowIcon} />, val: value.email, href: `mailto:${value.email}` },
                  { icon: <Phone size={15} className={rowIcon} />, val: value.phone, href: `tel:${value.phone.replace(/\s+/g, '')}` },
                  { icon: <Globe size={15} className={rowIcon} />, val: value.website, href: handle(value.website, 'https://') },
                  { icon: <Linkedin size={15} className={rowIcon} />, val: value.linkedin, href: handle(value.linkedin, 'https://www.linkedin.com/in/') },
                  { icon: <Instagram size={15} className={rowIcon} />, val: value.instagram, href: handle(value.instagram, 'https://instagram.com/') },
                  { icon: <Facebook size={15} className={rowIcon} />, val: value.facebook, href: handle(value.facebook, 'https://facebook.com/') },
                  { icon: <Twitter size={15} className={rowIcon} />, val: value.x, href: handle(value.x, 'https://x.com/') },
                ].filter(r => r.val)
                if (rows.length === 0) return <p className="text-sm text-[var(--muted)]">Sem contacto.</p>
                return <div className="space-y-1.5">{rows.map((r, i) => { const ext = r.href.startsWith('http'); return <a key={i} href={r.href} {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] transition-colors truncate">{r.icon}{r.val}</a> })}</div>
              })()}
            </EditableSection>

            <EditableSection title="Detalhes de negócio" icon={<Building2 size={15} />} canEdit={canEdit} initial={bizInit}
              onSave={async d => { if (!String(d.name).trim()) return 'O nome é obrigatório.'; const { error } = await supabase.from('partners').update({ name: String(d.name).trim(), company: d.company || null, nif: d.nif || null, kind: d.kind as Partner['kind'], status: d.status as Partner['status'], partner_type: d.partner_type || null, address: d.address || null, city: d.city || null, country: d.country || null, languages: d.languages }).eq('id', partner.id); if (error) return error.message; router.refresh(); return null }}>
              {({ editing, value, set }) => editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className={labelCls}>Nome *</label><input className={inputCls} value={value.name} onChange={e => set({ name: e.target.value })} /></div>
                  <div><label className={labelCls}>Empresa</label><input className={inputCls} value={value.company} onChange={e => set({ company: e.target.value })} /></div>
                  <div><label className={labelCls}>Tipo</label><select className={inputCls} value={value.kind} onChange={e => set({ kind: e.target.value })}><option value="empresa">Empresa</option><option value="individual">Individual</option></select></div>
                  <div><label className={labelCls}>Estado</label><select className={inputCls} value={value.status} onChange={e => set({ status: e.target.value })}><option value="potencial">Potencial</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
                  <div><label className={labelCls}>Tipo de parceria</label><select className={inputCls} value={value.partner_type} onChange={e => set({ partner_type: e.target.value })}><option value="">Selecionar…</option>{PARTNER_TYPES.map(pt => <option key={pt.key} value={pt.key}>{pt.label}</option>)}</select></div>
                  <div><label className={labelCls}>NIF</label><input className={inputCls} value={value.nif} onChange={e => set({ nif: e.target.value })} /></div>
                  <div><label className={labelCls}>Cidade</label><input className={inputCls} value={value.city} onChange={e => set({ city: e.target.value })} /></div>
                  <div><label className={labelCls}>País</label><input className={inputCls} value={value.country} onChange={e => set({ country: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={labelCls}>Morada</label><input className={inputCls} value={value.address} onChange={e => set({ address: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={labelCls}>Línguas</label><LanguageSelect value={value.languages} onChange={langs => set({ languages: langs })} /></div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <Row icon={<Building2 size={15} className={rowIcon} />} label="Empresa">{value.company || '—'}</Row>
                  <Row icon={<Handshake size={15} className={rowIcon} />} label="Tipo de parceria">{value.partner_type ? (PARTNER_TYPE_LABEL[value.partner_type] ?? value.partner_type) : '—'}</Row>
                  <Row icon={<Tag size={15} className={rowIcon} />} label="Tipo">{KIND_LABEL[value.kind] ?? value.kind}</Row>
                  <Row icon={<Hash size={15} className={rowIcon} />} label="NIF">{value.nif || '—'}</Row>
                  <Row icon={<MapPin size={15} className={rowIcon} />} label="Morada">{[value.address, value.city, value.country].filter(Boolean).join(', ') || '—'}</Row>
                  {value.languages.length > 0 && <Row icon={<Languages size={15} className={rowIcon} />} label="Línguas">{value.languages.join(', ')}</Row>}
                  <Row icon={<CircleCheck size={15} className={rowIcon} />} label="Adicionado">{added}</Row>
                </div>
              )}
            </EditableSection>
          </div>

          {isCompany && <PartnerContacts partnerId={partner.id} initial={initialContacts} canEdit={canEdit} orgName={partner.company || partner.name} />}

          <div className="flex items-center gap-3 pt-1">
            <button onClick={toggleIncomplete} disabled={!canEdit} className={`inline-flex items-center gap-2 text-sm ${canEdit ? 'hover:text-[#1A1A1A]' : 'cursor-default'} ${partner.incomplete ? 'text-[var(--muted)]' : ''}`}>
              {partner.incomplete ? <Square size={20} className="text-[var(--muted)]" /> : <SquareCheckBig size={20} className="text-green-600" />}
              Dados completos
            </button>
            <span className="text-xs text-[var(--muted)]">— {partner.incomplete ? 'marca quando estiver tudo preenchido' : 'desmarca se ainda falta informação'}</span>
          </div>
        </div>
      )}

      {tab === 'projetos' && <Wip module="Projetos" />}
      {tab === 'orcamentos' && <Wip module="Orçamentos" />}
      {tab === 'financas' && <Wip module="Finanças" />}
    </div>
  )
}
