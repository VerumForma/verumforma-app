import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import ClientsManager from '@/components/clients/ClientsManager'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clientes · VerumForma' }

export default async function ClientesPage() {
  // Durante o setup (sem Supabase) mostra o módulo com acesso total e lista vazia.
  if (!supabaseConfigured()) {
    return <ClientsManager initial={[]} canEdit />
  }

  const supabase = createClient()
  const level = await myPermission(supabase, 'clientes')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('clients').select('*').order('name')
  return <ClientsManager initial={(data ?? []) as Client[]} canEdit={canEdit(level)} />
}
