'use client'

import { useMemo, useState } from 'react'
import type { SortDir } from '@/components/ui/SortHeader'
import { useTablePrefs } from '@/components/providers/TablePrefsProvider'

export type Accessors<T> = Record<string, (row: T) => string | number | null | undefined>

// Estado de ordenação + linhas ordenadas. Se `tableKey` for dado e houver preferências
// de utilizador carregadas, arranca com a ordenação guardada e persiste as mudanças por user.
export function useTableSort<T>(rows: T[], accessors: Accessors<T>, initialKey: string, initialDir: SortDir = 'asc', tableKey?: string) {
  const prefsCtx = useTablePrefs()
  const saved = tableKey ? prefsCtx?.prefs[tableKey] : undefined
  const [sortKey, setSortKey] = useState(() => saved?.key ?? initialKey)
  const [sortDir, setSortDir] = useState<SortDir>(() => saved?.dir ?? initialDir)

  function toggle(key: string) {
    const nd: SortDir = key === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'
    setSortKey(key); setSortDir(nd)
    if (tableKey && prefsCtx) prefsCtx.save(tableKey, key, nd)
  }

  const sorted = useMemo(() => {
    const acc = accessors[sortKey]
    if (!acc) return rows
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = acc(a), bv = acc(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'pt', { numeric: true, sensitivity: 'base' }) * dir
    })
  }, [rows, sortKey, sortDir, accessors])

  return { sorted, sortKey, sortDir, toggle }
}
