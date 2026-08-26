'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/lib/supabase/types'
import EditableSection from '@/components/ui/EditableSection'
import { inputCls, labelCls } from '@/lib/formClasses'
import { STATUS_META, DEPARTMENTS, DEPT_LABEL, CONTRACT_TYPES, CONTRACT_LABEL, DRIVING_CATEGORIES } from '@/lib/team'
import { X, Mail, Phone, Contact, ShieldCheck, Tag, Building2, FileText, CalendarDays, Briefcase, Car, Award, Linkedin, Instagram, Facebook, Twitter } from 'lucide-react'

type Role = { key: string; label_pt: string }
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const rowIcon = 'text-[var(--muted)] shrink-0'
const Row = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm py-0.5">
    <span className="inline-flex items-center gap-2 text-[var(--muted)]">{icon}{label}</span>
    <span className="text-right">{children}</span>
  </div>
)

export function ContactBlock({ staff, canEdit }: { staff: Staff; canEdit: boolean }) {
  const supabase = createClient(); const router = useRouter()
  const init = { email: staff.email ?? '', phone: staff.phone ?? '', linkedin: staff.linkedin ?? '', instagram: staff.instagram ?? '', facebook: staff.facebook ?? '', x: staff.x ?? '' }
  const handle = (v: string, base: string) => v.startsWith('http') ? v : `${base}${v.replace(/^@/, '')}`
  return (
    <EditableSection title="Contacto" icon={<Contact size={15} />} canEdit={canEdit} initial={init}
      onSave={async d => { const { error } = await supabase.from('staff').update({ email: d.email || null, phone: d.phone || null, linkedin: d.linkedin || null, instagram: d.instagram || null, facebook: d.facebook || null, x: d.x || null }).eq('id', staff.id); if (error) return error.message; router.refresh(); return null }}>
      {({ editing, value, set }) => editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>Email</label><input className={inputCls} value={value.email} onChange={e => set({ email: e.target.value })} /></div>
          <div><label className={labelCls}>Telefone</label><input className={inputCls} value={value.phone} onChange={e => set({ phone: e.target.value })} /></div>
          <div><label className={labelCls}>LinkedIn</label><input className={inputCls} value={value.linkedin} onChange={e => set({ linkedin: e.target.value })} /></div>
          <div><label className={labelCls}>Instagram</label><input className={inputCls} value={value.instagram} onChange={e => set({ instagram: e.target.value })} /></div>
          <div><label className={labelCls}>Facebook</label><input className={inputCls} value={value.facebook} onChange={e => set({ facebook: e.target.value })} /></div>
          <div><label className={labelCls}>X</label><input className={inputCls} value={value.x} onChange={e => set({ x: e.target.value })} /></div>
        </div>
      ) : (() => {
        const rows = [
          { icon: <Mail size={15} className={rowIcon} />, val: value.email, href: `mailto:${value.email}` },
          { icon: <Phone size={15} className={rowIcon} />, val: value.phone, href: `tel:${value.phone.replace(/\s+/g, '')}` },
          { icon: <Linkedin size={15} className={rowIcon} />, val: value.linkedin, href: handle(value.linkedin, 'https://www.linkedin.com/in/') },
          { icon: <Instagram size={15} className={rowIcon} />, val: value.instagram, href: handle(value.instagram, 'https://instagram.com/') },
          { icon: <Facebook size={15} className={rowIcon} />, val: value.facebook, href: handle(value.facebook, 'https://facebook.com/') },
          { icon: <Twitter size={15} className={rowIcon} />, val: value.x, href: handle(value.x, 'https://x.com/') },
        ].filter(r => r.val)
        if (rows.length === 0) return <p className="text-sm text-[var(--muted)]">Sem contacto.</p>
        return (
          <div className="space-y-1.5">
            {rows.map((r, i) => {
              const ext = r.href.startsWith('http')
              return <a key={i} href={r.href} {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[#1A1A1A] transition-colors truncate">{r.icon}{r.val}</a>
            })}
          </div>
        )
      })()}
    </EditableSection>
  )
}

export function EmploymentBlock({ staff, canEdit, roles }: { staff: Staff; canEdit: boolean; roles: Role[] }) {
  const supabase = createClient(); const router = useRouter()
  const init = { name: staff.name, role: staff.role ?? '', cargo: staff.cargo ?? '', department: staff.department, status: staff.status as string, contract_type: staff.contract_type ?? '', hire_date: staff.hire_date ?? '' }
  const roleLabel = (k: string) => roles.find(r => r.key === k)?.label_pt ?? (k || '—')
  return (
    <EditableSection title="Emprego" icon={<Briefcase size={15} />} canEdit={canEdit} initial={init}
      onSave={async d => {
        if (!String(d.name).trim()) return 'O nome é obrigatório.'
        const { error } = await supabase.from('staff').update({ name: String(d.name).trim(), role: d.role || null, cargo: d.cargo || null, department: d.department, status: d.status as Staff['status'], contract_type: d.contract_type || null, hire_date: d.hire_date || null }).eq('id', staff.id)
        if (error) return error.message; router.refresh(); return null
      }}>
      {({ editing, value, set }) => editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>Nome *</label><input className={inputCls} value={value.name} onChange={e => set({ name: e.target.value })} /></div>
          <div><label className={labelCls}>Cargo</label><input className={inputCls} value={value.cargo} onChange={e => set({ cargo: e.target.value })} /></div>
          <div><label className={labelCls}>Perfil de acesso</label>
            <select className={inputCls} value={value.role} onChange={e => set({ role: e.target.value })}><option value="">Sem conta / a definir</option>{roles.map(r => <option key={r.key} value={r.key}>{r.label_pt}</option>)}</select></div>
          <div><label className={labelCls}>Departamento</label>
            <select className={inputCls} value={value.department} onChange={e => set({ department: e.target.value })}>{DEPARTMENTS.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select></div>
          <div><label className={labelCls}>Estado</label>
            <select className={inputCls} value={value.status} onChange={e => set({ status: e.target.value })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="licenca">De Licença</option></select></div>
          <div><label className={labelCls}>Tipo de contrato</label>
            <select className={inputCls} value={value.contract_type} onChange={e => set({ contract_type: e.target.value })}><option value="">—</option>{CONTRACT_TYPES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          <div><label className={labelCls}>Data de contratação</label><input type="date" className={inputCls} value={value.hire_date} onChange={e => set({ hire_date: e.target.value })} /></div>
        </div>
      ) : (
        <div className="space-y-0.5">
          <Row icon={<ShieldCheck size={15} className={rowIcon} />} label="Perfil de acesso">{roleLabel(value.role)}</Row>
          <Row icon={<Tag size={15} className={rowIcon} />} label="Cargo">{value.cargo || '—'}</Row>
          <Row icon={<Building2 size={15} className={rowIcon} />} label="Departamento">{DEPT_LABEL[value.department] ?? value.department}</Row>
          <Row icon={<span className={`inline-block w-2.5 h-2.5 rounded-full ${value.status === 'ativo' ? 'bg-green-500' : value.status === 'licenca' ? 'bg-amber-500' : 'bg-[var(--muted)]'}`} />} label="Estado">{STATUS_META[value.status]?.label ?? value.status}</Row>
          <Row icon={<FileText size={15} className={rowIcon} />} label="Contrato">{value.contract_type ? (CONTRACT_LABEL[value.contract_type] ?? value.contract_type) : '—'}</Row>
          <Row icon={<CalendarDays size={15} className={rowIcon} />} label="Contratação">{fmt(value.hire_date)}</Row>
        </div>
      )}
    </EditableSection>
  )
}

export function QualificationsBlock({ staff, canEdit }: { staff: Staff; canEdit: boolean }) {
  const supabase = createClient(); const router = useRouter()
  const [skillInput, setSkillInput] = useState('')
  const init = { driving_licence: staff.driving_licence, skills: staff.skills }
  return (
    <EditableSection title="Qualificações" icon={<Award size={15} />} canEdit={canEdit} initial={init}
      onSave={async d => { const { error } = await supabase.from('staff').update({ driving_licence: d.driving_licence, skills: d.skills }).eq('id', staff.id); if (error) return error.message; router.refresh(); return null }}>
      {({ editing, value, set }) => editing ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Carta de condução</label>
            <div className="flex flex-wrap gap-4">
              {DRIVING_CATEGORIES.map(c => (
                <label key={c} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={value.driving_licence.includes(c)} onChange={e => set({ driving_licence: e.target.checked ? [...value.driving_licence, c] : value.driving_licence.filter(x => x !== c) })} />{c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Competências</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {value.skills.map(sk => <span key={sk} className="inline-flex items-center gap-1 text-xs bg-[rgba(26,26,26,0.06)] rounded-[3px] px-2 py-1">{sk}<button type="button" onClick={() => set({ skills: value.skills.filter(x => x !== sk) })} className="text-[var(--muted)] hover:text-red-500"><X size={12} /></button></span>)}
            </div>
            <input className={inputCls} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = skillInput.trim(); if (v && !value.skills.includes(v)) set({ skills: [...value.skills, v] }); setSkillInput('') } }} placeholder="Escreve e Enter para adicionar…" />
          </div>
        </div>
      ) : (value.driving_licence.length > 0 || value.skills.length > 0) ? (
        <div className="space-y-3">
          {value.driving_licence.length > 0 && <Row icon={<Car size={15} className={rowIcon} />} label="Carta">{value.driving_licence.join(', ')}</Row>}
          {value.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{value.skills.map(s => <span key={s} className="text-xs bg-[rgba(26,26,26,0.06)] rounded-[3px] px-2 py-1">{s}</span>)}</div>}
        </div>
      ) : <p className="text-sm text-[var(--muted)]">Sem qualificações registadas.</p>}
    </EditableSection>
  )
}
