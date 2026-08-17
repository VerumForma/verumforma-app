import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import SuppliersManager from '@/components/suppliers/SuppliersManager'
import type { Supplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Fornecedores · VerumForma' }

export default async function FornecedoresPage() {
  if (!supabaseConfigured()) return <SuppliersManager initial={[]} canEdit />
  const supabase = createClient()
  const level = await myPermission(supabase, 'fornecedores')
  if (!canView(level)) redirect('/dashboard')
  const { data } = await supabase.from('suppliers').select('*').order('name')
  return <SuppliersManager initial={(data ?? []) as Supplier[]} canEdit={canEdit(level)} />
}
