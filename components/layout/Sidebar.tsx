'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FolderKanban, ListChecks, CalendarDays,
  Users, FileText, Truck, Handshake,
  HardHat, Boxes, Clock,
  Wallet, BarChart3, TrendingUp, Settings, LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Item = { label: string; href: string; module: string; icon: LucideIcon; ready?: boolean }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  { title: 'Principal', items: [
    { label: 'Dashboard', href: '/dashboard', module: 'dashboard', icon: LayoutDashboard, ready: true },
    { label: 'Projetos', href: '/projetos', module: 'projetos', icon: FolderKanban },
    { label: 'Tarefas', href: '/tarefas', module: 'tarefas', icon: ListChecks },
    { label: 'Calendário', href: '/calendario', module: 'calendario', icon: CalendarDays },
  ] },
  { title: 'Comercial', items: [
    { label: 'Clientes', href: '/clientes', module: 'clientes', icon: Users },
    { label: 'Orçamentos', href: '/orcamentos', module: 'orcamentos', icon: FileText },
    { label: 'Fornecedores', href: '/fornecedores', module: 'fornecedores', icon: Truck },
    { label: 'Parceiros', href: '/parceiros', module: 'parceiros', icon: Handshake },
  ] },
  { title: 'Recursos', items: [
    { label: 'Equipa', href: '/equipa', module: 'equipa', icon: HardHat },
    { label: 'Materiais', href: '/materiais', module: 'materiais', icon: Boxes },
    { label: 'Assiduidade', href: '/assiduidade', module: 'assiduidade', icon: Clock },
  ] },
  { title: 'Gestão', items: [
    { label: 'Finanças', href: '/financas', module: 'financas', icon: Wallet },
    { label: 'Estatísticas', href: '/estatisticas', module: 'estatisticas', icon: BarChart3 },
    { label: 'Investimentos', href: '/investimentos', module: 'investimentos', icon: TrendingUp },
    { label: 'Definições', href: '/definicoes', module: 'definicoes', icon: Settings },
  ] },
]

const BUILT = new Set<string>(['dashboard', 'clientes', 'fornecedores', 'parceiros', 'equipa', 'materiais'])

export default function Sidebar({ allowed, name, role, onNavigate }: { allowed: string[]; name: string; role: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const canSee = new Set(allowed)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 bg-[#1A1A1A] text-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-[rgba(255,255,255,0.08)]">
        <p className="font-playfair text-xl leading-none">VerumForma</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B6560] mt-1">Gestão de obra</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3">
        {groups.map(group => {
          const items = group.items.filter(it => canSee.has(it.module))
          if (items.length === 0) return null
          return (
            <div key={group.title} className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#6B6560] px-3 mb-2">{group.title}</p>
              <ul className="flex flex-col gap-0.5">
                {items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  const base = 'flex items-center gap-3 text-sm px-3 py-2 rounded-[6px] transition-colors'
                  const ready = item.ready || BUILT.has(item.module)
                  if (!ready) {
                    return (
                      <li key={item.href}>
                        <span className={`${base} text-[#6B6560] cursor-default`} title="Em breve">
                          <Icon size={16} /> {item.label}
                          <span className="ml-auto text-[9px] uppercase tracking-wider opacity-60">em breve</span>
                        </span>
                      </li>
                    )
                  }
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={onNavigate} className={`${base} ${active ? 'bg-white text-[#1A1A1A]' : 'text-[#C9C4BE] hover:text-white hover:bg-[rgba(255,255,255,0.06)]'}`}>
                        <Icon size={16} /> {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-4">
        <p className="text-sm text-white truncate">{name}</p>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6560] mb-3">{role}</p>
        <button onClick={signOut} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#C9C4BE] hover:text-white transition-colors">
          <LogOut size={15} /> Sair
        </button>
      </div>
    </aside>
  )
}
