import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import ClientDetail from '@/components/clients/ClientDetail'
import type { Client, ClientContact } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'clientes')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('clients').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const { data: contacts } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('client_id', params.id)
    .order('is_primary', { ascending: false })
    .order('name')

  return <ClientDetail client={data as Client} canEdit={canEdit(level)} initialContacts={(contacts ?? []) as ClientContact[]} />
}
