'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function AppShell({ allowed, name, role, children }: { allowed: string[]; name: string; role: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-[var(--bg)] lg:flex">
      {/* Desktop: barra lateral fixa */}
      <div className="hidden lg:block">
        <Sidebar allowed={allowed} name={name} role={role} />
      </div>

      {/* Tablet/telemóvel: cabeçalho slim com botão de menu */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="text-[var(--text)]"><Menu size={22} /></button>
        <span className="font-playfair text-lg">VerumForma</span>
      </div>

      {/* Drawer no mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative"><Sidebar allowed={allowed} name={name} role={role} onNavigate={() => setOpen(false)} /></div>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10 xl:p-12">{children}</main>
    </div>
  )
}
