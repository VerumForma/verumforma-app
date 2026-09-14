'use client'

import { useEffect, useRef } from 'react'

// Checkbox que suporta estado "indeterminado" (para o cabeçalho de selecionar-todos).
export default function SelectCheckbox({ checked, indeterminate, onChange, ariaLabel }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void; ariaLabel?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={ariaLabel} className="accent-[#1A1A1A] cursor-pointer align-middle" />
}
