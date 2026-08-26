import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import type { Profile, Role } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · VerumForma' }

export default async function DashboardPage() {
  let roleLabel = 'Admin'
  let roleKey = 'admin'

  if (supabaseConfigured()) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      roleKey = (p as Pick<Profile, 'role'> | null)?.role ?? 'unassigned'
      const { data: r } = await supabase.from('roles').select('label_pt').eq('key', roleKey).single()
      roleLabel = (r as Pick<Role, 'label_pt'> | null)?.label_pt ?? roleKey
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-playfair text-3xl mb-1">Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">Os KPIs e atalhos aparecem aqui à medida que criamos os módulos.</p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
          <span className="uppercase tracking-wider text-[var(--muted)]">Vista</span>
          <span className="font-medium">{roleLabel}</span>
          <span className="text-[var(--muted)]">({roleKey})</span>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-8 text-center">
        <p className="font-playfair text-xl mb-2">MVP em construção</p>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
          A barra lateral mostra só os módulos permitidos para este role.
          Muda o <span className="font-mono">role</span> deste utilizador no Supabase para testar as várias vistas.
        </p>
      </div>
    </div>
  )
}
