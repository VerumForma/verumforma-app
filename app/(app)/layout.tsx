import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { getPermissions, canView } from '@/lib/permissions'
import AppShell from '@/components/layout/AppShell'
import TablePrefsProvider, { type TablePref } from '@/components/providers/TablePrefsProvider'
import type { Profile, Role } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const ALL = ['dashboard','projetos','tarefas','calendario','clientes','orcamentos','fornecedores','parceiros','equipa','materiais','assiduidade','financas','estatisticas','investimentos','definicoes']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name = 'Configuração'
  let roleLabel = 'Admin'
  let allowed: string[] = ALL
  let userId: string | null = null
  let tablePrefs: Record<string, TablePref> = {}

  if (supabaseConfigured()) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    userId = user.id
    const { data: prefRows } = await supabase.from('user_table_prefs').select('table_key, sort_key, sort_dir').eq('user_id', user.id)
    for (const r of (prefRows ?? []) as { table_key: string; sort_key: string; sort_dir: string }[]) tablePrefs[r.table_key] = { key: r.sort_key, dir: r.sort_dir === 'desc' ? 'desc' : 'asc' }
  }

  return (
    <TablePrefsProvider userId={userId} initial={tablePrefs}>
      <AppShell allowed={allowed} name={name} role={roleLabel}>
        {children}
      </AppShell>
    </TablePrefsProvider>
  )
}
