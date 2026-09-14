import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import FinanceWorkspace from '@/components/finance/FinanceWorkspace'
import type { Expense, Receipt, CreditNote, Payroll, PayrollLine, ExpenseCategory, FinanceAttachment } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Finanças · VerumForma' }

const emptyProps = { expenses: [], receipts: [], creditNotes: [], payroll: [], payrollLines: [], suppliers: [], clients: [], staff: [], projects: [], categories: [], attCounts: {} }

export default async function FinancasPage() {
  if (!supabaseConfigured()) return <FinanceWorkspace {...emptyProps} canEdit />
  const supabase = createClient()
  const level = await myPermission(supabase, 'financas')
  if (!canView(level)) redirect('/dashboard')

  const [
    { data: expenses }, { data: receipts }, { data: creditNotes }, { data: payroll }, { data: payrollLines },
    { data: categories }, { data: suppliers }, { data: clients }, { data: staff }, { data: projects }, { data: attachments },
  ] = await Promise.all([
    supabase.from('expenses').select('*').order('issue_date', { ascending: false }),
    supabase.from('receipts').select('*').order('issue_date', { ascending: false }),
    supabase.from('credit_notes').select('*'),
    supabase.from('payroll').select('*').order('period', { ascending: false }),
    supabase.from('payroll_lines').select('*').order('sort'),
    supabase.from('expense_categories').select('*').order('name'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('staff').select('id, name').order('name'),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('finance_attachments').select('entity_id'),
  ])

  const attCounts: Record<string, number> = {}
  for (const a of (attachments ?? []) as Pick<FinanceAttachment, 'entity_id'>[]) attCounts[a.entity_id] = (attCounts[a.entity_id] ?? 0) + 1

  return (
    <FinanceWorkspace
      expenses={(expenses ?? []) as Expense[]}
      receipts={(receipts ?? []) as Receipt[]}
      creditNotes={(creditNotes ?? []) as CreditNote[]}
      payroll={(payroll ?? []) as Payroll[]}
      payrollLines={(payrollLines ?? []) as PayrollLine[]}
      categories={(categories ?? []) as ExpenseCategory[]}
      suppliers={(suppliers ?? []) as { id: string; name: string }[]}
      clients={(clients ?? []) as { id: string; name: string }[]}
      staff={(staff ?? []) as { id: string; name: string }[]}
      projects={(projects ?? []) as { id: string; name: string }[]}
      attCounts={attCounts}
      canEdit={canEdit(level)}
    />
  )
}
