'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Topbar({ name, role }: { name: string; role: string }) {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <header className="h-16 shrink-0 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-end gap-4 px-6">
      <div className="text-right leading-tight">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{role}</p>
      </div>
      <button
        onClick={signOut}
        className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted)] hover:text-[#1A1A1A] transition-colors"
      >
        <LogOut size={15} /> Sair
      </button>
    </header>
  )
}
