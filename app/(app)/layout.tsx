import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { getPermissions, canView } from '@/lib/permissions'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { Profile, Role } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// Modules visible during setup (no Supabase yet) — show everything.
const ALL = ['dashboard','projetos','tarefas','calendario','clientes','orcamentos','fornecedores','parceiros','equipa','materiais','assiduidade','financas','estatisticas','investimentos','definicoes']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name = 'Configuração'
  let roleLabel = 'Admin'
  let allowed: string[] = ALL

  if (supabaseConfigured()) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    name = user.email ?? ''

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const profile = profileData as Profile | null
    const roleKey = profile?.role ?? 'unassigned'
    if (profile) name = profile.full_name || profile.email || name

    const { data: roleData } = await supabase.from('roles').select('*').eq('key', roleKey).single()
    roleLabel = (roleData as Role | null)?.label_pt ?? roleKey

    const perms = await getPermissions(supabase, roleKey)
    allowed = Object.keys(perms).filter(k => canView(perms[k]))
    if (!allowed.includes('dashboard')) allowed = ['dashboard', ...allowed]
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar allowed={allowed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar name={name} role={roleLabel} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
