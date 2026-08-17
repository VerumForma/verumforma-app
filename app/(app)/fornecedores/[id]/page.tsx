import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import SupplierDetail from '@/components/suppliers/SupplierDetail'
import type { Supplier, SupplierContact } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'fornecedores')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('suppliers').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const { data: contacts } = await supabase
    .from('supplier_contacts').select('*').eq('supplier_id', params.id)
    .order('is_primary', { ascending: false }).order('name')

  return <SupplierDetail supplier={data as Supplier} canEdit={canEdit(level)} initialContacts={(contacts ?? []) as SupplierContact[]} />
}
