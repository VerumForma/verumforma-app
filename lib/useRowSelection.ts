'use client'

import { useCallback, useRef, useState } from 'react'

// Seleção de linhas com suporte a shift-clique (intervalo). orderedIds = ordem visível atual.
export function useRowSelection(orderedIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const lastIndex = useRef<number | null>(null)

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback((id: string, shift: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      const idx = orderedIds.indexOf(id)
      if (shift && lastIndex.current !== null && idx !== -1) {
        const a = Math.min(lastIndex.current, idx), b = Math.max(lastIndex.current, idx)
        const add = !prev.has(id)
        for (let i = a; i <= b; i++) { const rid = orderedIds[i]; if (rid) { if (add) next.add(rid); else next.delete(rid) } }
      } else {
        if (next.has(id)) next.delete(id); else next.add(id)
      }
      lastIndex.current = idx
      return next
    })
  }, [orderedIds])

  const clear = useCallback(() => { setSelected(new Set()); lastIndex.current = null }, [])

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      const allSel = orderedIds.length > 0 && orderedIds.every(id => prev.has(id))
      return allSel ? new Set() : new Set(orderedIds)
    })
  }, [orderedIds])

  const allSelected = orderedIds.length > 0 && orderedIds.every(id => selected.has(id))
  const count = selected.size
  return {
    isSelected, toggle, clear, toggleAll, count, allSelected,
    someSelected: count > 0 && !allSelected,
    selectedIds: () => Array.from(selected),
  }
}
