import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import ProjectsManager from '@/components/projects/ProjectsManager'
import type { Project } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Projetos · VerumForma' }

type Ref = { id: string; name: string }

export default async function ProjetosPage() {
  if (!supabaseConfigured()) {
    return <ProjectsManager initial={[]} clients={[]} staff={[]} canEdit />
  }

  const supabase = createClient()
  const level = await myPermission(supabase, 'projetos')
  if (!canView(level)) redirect('/dashboard')

  const [{ data }, { data: clients }, { data: staff }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('staff').select('id, name').order('name'),
  ])

  return (
    <ProjectsManager
      initial={(data ?? []) as Project[]}
      clients={(clients ?? []) as Ref[]}
      staff={(staff ?? []) as Ref[]}
      canEdit={canEdit(level)}
    />
  )
}
