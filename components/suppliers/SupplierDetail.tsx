'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Supplier, SupplierContact } from '@/lib/supabase/types'
import { STATUS_META, KIND_LABEL, SUPPLY_LABEL } from '@/lib/suppliers'
import SupplierContacts from './SupplierContacts'
import { buildEntityVCard, downloadVCard } from '@/lib/vcard'
import { ArrowLeft, MapPin, AlertTriangle, Download } from 'lucide-react'

type Tab = 'overview' | 'contactos' | 'projetos' | 'orcamentos' | 'materiais' | 'financas'

function Wip({ module }: { module: string }) {
  return (
    <div className="relative rounded-[4px] border border-dashed border-[var(--border)] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#1A1A1A 0 8px,transparent 8px 16px)' }} />
      <div className="relative py-14 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] mb-1">Ligação futura</p>
        <p className="text-sm text-[var(--muted)]">Liga-se automaticamente ao módulo <span className="font-medium">{module}</span> quando o construirmos.</p>
      </div>
    </div>
  )
}

function card(children: React.ReactNode, title: string) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-6">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] mb-4">{title}</p>
      {children}
    </div>
  )
}

export default function SupplierDetail({ supplier, canEdit, initialContacts }: { supplier: Supplier; canEdit: boolean; initialContacts: SupplierContact[] }) {
  const [tab, setTab] = useState<Tab>('overview')
  const st = STATUS_META[supplier.status]
  const added = new Date(supplier.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  const location = [supplier.address, supplier.city, supplier.country].filter(Boolean).join(', ')
  const isCompany = supplier.kind === 'empresa'
  const supplies = (supplier.supplies ?? []).map(k => (k === 'mao_obra' && supplier.labour_type) ? `${SUPPLY_LABEL[k]} (${supplier.labour_type})` : (SUPPLY_LABEL[k] ?? k))

  const tabs: { key: Tab; label: string; wip?: boolean }[] = [
    { key: 'overview', label: 'Visão Geral' },
    ...(isCompany ? [{ key: 'contactos' as Tab, label: 'Contactos' }] : []),
    { key: 'projetos', label: 'Projetos', wip: true },
    { key: 'orcamentos', label: 'Orçamentos', wip: true },
    { key: 'materiais', label: 'Materiais', wip: true },
    { key: 'financas', label: 'Finanças', wip: true },
  ]

  return (
    <div className="max-w-5xl">
      <Link href="/fornecedores" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] mb-6">
        <ArrowLeft size={16} /> Fornecedores
      </Link>

      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-playfair text-3xl">{supplier.name}</h1>
        <button onClick={() => downloadVCard(`${supplier.name}.vcf`, buildEntityVCard(supplier))} className="shrink-0 inline-flex items-center gap-2 text-xs uppercase tracking-wider border border-[var(--border)] rounded-[3px] px-3 py-2 hover:bg-[rgba(26,26,26,0.04)]" title="Exportar para lista de contactos (.vcf)">
          <Download size={14} /> Exportar
        </button>
      </div>
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] ${st?.cls}`}>{st?.label}</span>
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] bg-[rgba(26,26,26,0.06)] text-[var(--muted)]">{KIND_LABEL[supplier.kind]}</span>
        {supplier.incomplete && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-[3px] bg-amber-100 text-amber-800"><AlertTriangle size={11} /> Dados incompletos</span>}
        {supplier.company && <span className="text-sm text-[var(--muted)]">· {supplier.company}</span>}
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`relative text-sm px-4 py-2.5 -mb-px border-b-2 transition-colors ${tab === t.key ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`}>
            {t.label}
            {t.wip && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-[var(--muted)] opacity-70">• wip</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {card(
            location || supplier.email || supplier.phone || supplier.website ? (
              <div className="space-y-3 text-sm">
                {location && <p className="flex items-start gap-2"><MapPin size={16} className="text-[var(--muted)] mt-0.5 shrink-0" /> {location}</p>}
                {supplier.email && <p className="text-[var(--muted)]">{supplier.email}</p>}
                {supplier.phone && <p className="text-[var(--muted)]">{supplier.phone}</p>}
                {supplier.website && <p className="text-[var(--muted)]">{supplier.website}</p>}
              </div>
            ) : <p className="text-sm text-[var(--muted)]">Sem dados de contacto.</p>,
            isCompany ? 'Contactos oficiais' : 'Informação de contacto',
          )}

          {card(
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Empresa</span><span className="text-right">{supplier.company || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">NIF</span><span>{supplier.nif || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Fornece</span><span className="text-right">{supplies.length ? supplies.join(', ') : '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Adicionado</span><span>{added}</span></div>
            </div>,
            'Detalhes de negócio',
          )}

          <div className="lg:col-span-2">
            {card(
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[4px] bg-[rgba(26,26,26,0.03)] p-4 text-center"><p className="font-playfair text-2xl">0</p><p className="text-xs text-[var(--muted)]">Materiais</p></div>
                <div className="rounded-[4px] bg-[rgba(26,26,26,0.03)] p-4 text-center"><p className="font-playfair text-2xl">0</p><p className="text-xs text-[var(--muted)]">Orçamentos</p></div>
                <div className="relative rounded-[4px] p-4 text-center overflow-hidden border border-dashed border-[var(--border)]">
                  <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#1A1A1A 0 8px,transparent 8px 16px)' }} />
                  <p className="relative font-playfair text-2xl text-[var(--muted)]">—</p>
                  <p className="relative text-xs text-[var(--muted)]">A pagar · em breve</p>
                </div>
              </div>,
              'Resumo rápido',
            )}
          </div>
        </div>
      )}

      {tab === 'contactos' && <SupplierContacts supplierId={supplier.id} initial={initialContacts} canEdit={canEdit} orgName={supplier.company || supplier.name} />}
      {tab === 'projetos' && <Wip module="Projetos" />}
      {tab === 'orcamentos' && <Wip module="Orçamentos" />}
      {tab === 'materiais' && <Wip module="Materiais" />}
      {tab === 'financas' && <Wip module="Finanças" />}
    </div>
  )
}
