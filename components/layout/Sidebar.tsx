'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, ListChecks, CalendarDays,
  Users, FileText, Truck, Handshake,
  HardHat, Boxes, Clock,
  Wallet, BarChart3, TrendingUp, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Item = { label: string; href: string; icon: LucideIcon; ready?: boolean }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, ready: true },
      { label: 'Projetos', href: '/projetos', icon: FolderKanban },
      { label: 'Tarefas', href: '/tarefas', icon: ListChecks },
      { label: 'Calendário', href: '/calendario', icon: CalendarDays },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { label: 'Clientes', href: '/clientes', icon: Users },
      { label: 'Orçamentos', href: '/orcamentos', icon: FileText },
      { label: 'Fornecedores', href: '/fornecedores', icon: Truck },
      { label: 'Parceiros', href: '/parceiros', icon: Handshake },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { label: 'Equipa', href: '/equipa', icon: HardHat },
      { label: 'Materiais', href: '/materiais', icon: Boxes },
      { label: 'Assiduidade', href: '/assiduidade', icon: Clock },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Finanças', href: '/financas', icon: Wallet },
      { label: 'Estatísticas', href: '/estatisticas', icon: BarChart3 },
      { label: 'Investimentos', href: '/investimentos', icon: TrendingUp },
      { label: 'Definições', href: '/definicoes', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 shrink-0 bg-[#1A1A1A] text-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-[rgba(255,255,255,0.08)]">
        <p className="font-playfair text-xl leading-none">VerumForma</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B6560] mt-1">Gestão de obra</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        {groups.map(group => (
          <div key={group.title} className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6B6560] px-3 mb-2">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                const base = 'flex items-center gap-3 text-sm px-3 py-2 rounded-[3px] transition-colors'
                if (!item.ready) {
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
                    <Link
                      href={item.href}
                      className={`${base} ${active ? 'bg-white text-[#1A1A1A]' : 'text-[#C9C4BE] hover:text-white hover:bg-[rgba(255,255,255,0.06)]'}`}
                    >
                      <Icon size={16} /> {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
