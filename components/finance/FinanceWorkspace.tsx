'use client'

import { useState } from 'react'
import type { Expense, Receipt, CreditNote, Payroll, PayrollLine, ExpenseCategory } from '@/lib/supabase/types'
import ExpensesManager from './ExpensesManager'
import ReceiptsManager from './ReceiptsManager'
import PayrollManager from './PayrollManager'
import CategoryManager from './CategoryManager'
import { Sparkles, X } from 'lucide-react'

type Ref = { id: string; name: string }
type Tab = 'despesas' | 'recibos' | 'vencimentos'

export default function FinanceWorkspace(props: {
  expenses: Expense[]
  receipts: Receipt[]
  creditNotes: CreditNote[]
  payroll: Payroll[]
  payrollLines: PayrollLine[]
  suppliers: Ref[]
  clients: Ref[]
  staff: Ref[]
  projects: Ref[]
  categories: ExpenseCategory[]
  attCounts: Record<string, number>
  canEdit: boolean
}) {
  const [tab, setTab] = useState<Tab>('despesas')
  const [categories, setCategories] = useState<ExpenseCategory[]>(props.categories)
  const [showCats, setShowCats] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null)

  const tabs: [Tab, string][] = [['despesas', 'Despesas'], ['recibos', 'Recibos'], ['vencimentos', 'Vencimentos']]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="font-playfair text-3xl">Finanças</h1>
          <nav className="flex items-center gap-5">
            {tabs.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`pb-1 text-sm transition-colors border-b-2 ${tab === k ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`}>{l}</button>
            ))}
          </nav>
        </div>
        <div ref={setToolbarEl} className="flex items-center gap-2 flex-wrap" />
      </div>

      {tab === 'despesas' && (
        <ExpensesManager initial={props.expenses} suppliers={props.suppliers} projects={props.projects} categories={categories} attCounts={props.attCounts} canEdit={props.canEdit} onImport={() => setShowImport(true)} onManageCategories={() => setShowCats(true)} toolbarSlot={toolbarEl} />
      )}
      {tab === 'recibos' && (
        <ReceiptsManager initial={props.receipts} clients={props.clients} projects={props.projects} creditNotes={props.creditNotes} attCounts={props.attCounts} canEdit={props.canEdit} onImport={() => setShowImport(true)} toolbarSlot={toolbarEl} />
      )}
      {tab === 'vencimentos' && (
        <PayrollManager initial={props.payroll} lines={props.payrollLines} staff={props.staff} categories={categories} attCounts={props.attCounts} canEdit={props.canEdit} onImport={() => setShowImport(true)} toolbarSlot={toolbarEl} />
      )}

      {showCats && <CategoryManager initial={categories} onClose={() => setShowCats(false)} onChanged={setCategories} />}

      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-[6px] w-full max-w-xl my-12 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-playfair text-2xl flex items-center gap-2"><Sparkles size={20} /> Importar por IA</h2>
              <button onClick={() => setShowImport(false)} className="text-[var(--muted)] hover:text-[#1A1A1A]"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-5">
              {['Carregar', 'A extrair', 'Rever', 'Ligar & Guardar'].map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center text-[10px]">{i + 1}</span>{s}
                  {i < 3 && <span className="text-[var(--border)]">›</span>}
                </span>
              ))}
            </div>
            <div className="border border-dashed border-[var(--border)] rounded-[6px] p-10 text-center">
              <p className="text-sm font-medium mb-1">Extração automática de faturas — em breve</p>
              <p className="text-xs text-[var(--muted)]">Vai ler PDF/imagem, extrair fornecedor, valores e datas, e propor a ficha pré-preenchida. Precisa do conector de IA (Smart Importer). Por agora, usa a entrada manual.</p>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowImport(false)} className="text-sm bg-[#1A1A1A] text-white px-5 py-2 rounded-[3px] hover:opacity-80">Entrada manual</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
