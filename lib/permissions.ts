import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, PermissionLevel } from './supabase/types'

// A user's permissions: module_key -> level.
export type PermissionMap = Record<string, PermissionLevel>

export function canView(level?: PermissionLevel | null): boolean {
  return !!level && level !== 'none'
}
export function canEdit(level?: PermissionLevel | null): boolean {
  return level === 'edit_assigned' || level === 'edit_all'
}
export function isAll(level?: PermissionLevel | null): boolean {
  return level === 'view_all' || level === 'edit_all'
}

// Load the permission map for a given role from the matrix.
export async function getPermissions(
  supabase: SupabaseClient<Database>,
  roleKey: string,
): Promise<PermissionMap> {
  const { data } = await supabase
    .from('role_permissions')
    .select('module_key, level')
    .eq('role_key', roleKey)
  const map: PermissionMap = {}
  for (const row of data ?? []) map[row.module_key] = row.level
  return map
}
