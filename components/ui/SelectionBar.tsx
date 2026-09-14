'use client'

import ConfirmButton from './ConfirmButton'
import { Trash2, X } from 'lucide-react'

// Barra de ações que aparece quando há linhas selecionadas.
export default function SelectionBar({ count, onClear, onDelete, noun = 'itens' }: {
  count: number; onClear: () => void; onDelete: () => void; noun?: string
}) {
  if (count === 0) return null
  return (
    <div className="mb-3 flex items-center gap-3 bg-[#1A1A1A] text-white rounded-[4px] px-4 py-2.5 text-sm">
      <span className="font-medium">{count} selecionado{count === 1 ? '' : 's'}</span>
      <div className="ml-auto flex items-center gap-2">
        <ConfirmButton onConfirm={onDelete} message={`Eliminar ${count} ${noun}? Esta ação não pode ser anulada.`} confirmLabel="Eliminar" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-[3px]"><Trash2 size={14} /> Eliminar</ConfirmButton>
        <button onClick={onClear} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 hover:bg-white/10 rounded-[3px]"><X size={14} /> Limpar</button>
      </div>
    </div>
  )
}
