import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import ProjectDetail from '@/components/projects/ProjectDetail'
import type { Project, Expense, Receipt } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Ref = { id: string; name: string }

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'projetos')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('projects').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const [{ data: clients }, { data: staff }, { data: expenses }, { data: receipts }] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('staff').select('id, name').order('name'),
    supabase.from('expenses').select('*').eq('project_id', params.id).order('issue_date', { ascending: false }),
    supabase.from('receipts').select('*').eq('project_id', params.id).order('issue_date', { ascending: false }),
  ])

  return (
    <ProjectDetail
      project={data as Project}
      canEdit={canEdit(level)}
      clients={(clients ?? []) as Ref[]}
      staff={(staff ?? []) as Ref[]}
      expenses={(expenses ?? []) as Expense[]}
      receipts={(receipts ?? []) as Receipt[]}
    />
  )
}
