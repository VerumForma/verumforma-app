'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SortDir } from '@/components/ui/SortHeader'

export type TablePref = { key: string; dir: SortDir }
type Ctx = { prefs: Record<string, TablePref>; save: (tableKey: string, key: string, dir: SortDir) => void }

const TablePrefsContext = createContext<Ctx | null>(null)
export function useTablePrefs() { return useContext(TablePrefsContext) }

export default function TablePrefsProvider({ userId, initial, children }: { userId: string | null; initial: Record<string, TablePref>; children: ReactNode }) {
  const [prefs, setPrefs] = useState<Record<string, TablePref>>(initial)
  const save = useCallback((tableKey: string, key: string, dir: SortDir) => {
    setPrefs(p => ({ ...p, [tableKey]: { key, dir } }))
    if (!userId) return
    const supabase = createClient()
    void supabase.from('user_table_prefs').upsert(
      { user_id: userId, table_key: tableKey, sort_key: key, sort_dir: dir, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,table_key' },
    )
  }, [userId])
  return <TablePrefsContext.Provider value={{ prefs, save }}>{children}</TablePrefsContext.Provider>
}
