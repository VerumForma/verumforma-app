import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { Profile } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name = 'Configuração'
  let role = 'setup'

  // Once Supabase is wired, gate access and load the profile.
  if (supabaseConfigured()) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    name = user.email ?? ''
    role = 'staff'
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const profile = data as Profile | null
    if (profile) {
      name = profile.full_name || profile.email || name
      role = profile.role
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar name={name} role={role} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
