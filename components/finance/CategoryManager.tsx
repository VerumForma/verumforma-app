'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseCategory } from '@/lib/supabase/types'
import { Plus, Trash2, X } from 'lucide-react'

const input = 'w-full bg-white text-sm px-3 py-2 border border-[var(--border)] rounded-[3px] outline-none focus:border-[#1A1A1A] transition-colors'
const label = 'block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5'

export default function CategoryManager({ initial, onClose, onChanged }: { initial: ExpenseCategory[]; onClose: () => void; onChanged: (cats: ExpenseCategory[]) => void }) {
  const supabase = createClient()
  const [rows, setRows] = useState<ExpenseCategory[]>(initial)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const { data } = await supabase.from('expense_categories').select('*').order('name')
    const list = (data ?? []) as ExpenseCategory[]
    setRows(list); onChanged(list)
  }

  async function add() {
    if (!name.trim()) { setError('O nome é obrigatório.'); return }
    setBusy(true); setError('')
    const { error } = await supabase.from('expense_categories').insert({ name: name.trim(), color, internal })
    setBusy(false)
    if (error) { setError(error.message); return }
    setName(''); setColor('#6366f1'); setInternal(false); refresh()
  }

  async function remove(id: string) {
    if (!confirm('Eliminar esta categoria?')) return
    await supabase.from('expense_categories').delete().eq('id', id); refresh()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-[6px] w-full max-w-lg my-8 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl">Categorias de despesa</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
        </div>

        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] border-b border-[var(--border)] pb-2 mb-4">Nova categoria</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nome <span className="text-red-500">*</span></label>
            <input className={input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className={label}>Cor</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-9 border border-[var(--border)] rounded-[3px] p-0.5 bg-white" />
              <input className={input} value={color} onChange={e => setColor(e.target.value)} />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
          <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} />
          Categoria interna
        </label>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <button onClick={add} disabled={busy} className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm bg-[#1A1A1A] text-white px-4 py-2.5 rounded-[3px] hover:opacity-80 disabled:opacity-50">
          <Plus size={15} /> {busy ? 'A adicionar…' : 'Adicionar categoria'}
        </button>

        {rows.length > 0 && (
          <ul className="mt-6 flex flex-col gap-1.5">
            {rows.map(c => (
              <li key={c.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-[var(--border)] last:border-0">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
                {c.internal && <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">interna</span>}
                <button onClick={() => remove(c.id)} className="ml-auto text-[var(--muted)] hover:text-red-500" title="Eliminar"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="text-sm px-5 py-2 border border-[var(--border)] rounded-[3px] hover:bg-[rgba(26,26,26,0.04)]">Fechar</button>
        </div>
      </div>
    </div>
  )
}
