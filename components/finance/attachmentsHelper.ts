import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, FinanceAttachment } from '@/lib/supabase/types'

type SB = SupabaseClient<Database>
export type FinanceEntity = 'expense' | 'receipt' | 'payroll'

export async function uploadAttachments(supabase: SB, entityType: FinanceEntity, entityId: string, files: File[]) {
  for (const f of files) {
    const safe = f.name.replace(/[^\w.\-]+/g, '_')
    const path = `${entityType}/${entityId}/${Date.now()}-${safe}`
    const { error } = await supabase.storage.from('financas').upload(path, f)
    if (error) throw error
    const { error: e2 } = await supabase.from('finance_attachments').insert({ entity_type: entityType, entity_id: entityId, name: f.name, file_path: path })
    if (e2) throw e2
  }
}

export async function removeAttachment(supabase: SB, att: FinanceAttachment) {
  await supabase.storage.from('financas').remove([att.file_path])
  await supabase.from('finance_attachments').delete().eq('id', att.id)
}

export async function openAttachment(supabase: SB, att: FinanceAttachment) {
  const { data } = await supabase.storage.from('financas').createSignedUrl(att.file_path, 3600)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
}
