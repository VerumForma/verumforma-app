// Rótulos, constantes e helpers do módulo Finanças (Despesas / Recibos / Vencimentos).

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL'] as const
export const VAT_RATES = [23, 13, 6, 0] as const

// ---- Estados ----
export const EXPENSE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Aprovado', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pago', cls: 'bg-green-100 text-green-800' },
  overdue: { label: 'Em Atraso', cls: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelado', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
}
export const EXPENSE_STATUSES = ['pending', 'approved', 'paid', 'overdue', 'cancelled'] as const

export const RECEIPT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
  issued: { label: 'Emitido', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pago', cls: 'bg-green-100 text-green-800' },
  overdue: { label: 'Em Atraso', cls: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelado', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
}
export const RECEIPT_STATUSES = ['draft', 'issued', 'paid', 'overdue', 'cancelled'] as const

export const PAYROLL_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
  approved: { label: 'Aprovado', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pago', cls: 'bg-green-100 text-green-800' },
}
export const PAYROLL_STATUSES = ['draft', 'approved', 'paid'] as const

// ---- Tipos de linha de vencimento ----
export const PAYROLL_LINE_TYPES: { key: string; label: string; kind: 'earning' | 'deduction' }[] = [
  { key: 'base_salary', label: 'Vencimento base', kind: 'earning' },
  { key: 'bonus', label: 'Prémio / Bónus', kind: 'earning' },
  { key: 'allowance', label: 'Subsídio', kind: 'earning' },
  { key: 'meal', label: 'Sub. alimentação', kind: 'earning' },
  { key: 'overtime', label: 'Horas extra', kind: 'earning' },
  { key: 'irs', label: 'Retenção IRS', kind: 'deduction' },
  { key: 'ss', label: 'Segurança Social', kind: 'deduction' },
  { key: 'other_deduction', label: 'Outra dedução', kind: 'deduction' },
]
export const PAYROLL_TYPE_LABEL: Record<string, string> = Object.fromEntries(PAYROLL_LINE_TYPES.map(t => [t.key, t.label]))
export const PAYROLL_TYPE_KIND: Record<string, 'earning' | 'deduction'> = Object.fromEntries(PAYROLL_LINE_TYPES.map(t => [t.key, t.kind]))

// ---- Helpers de dinheiro / IVA ----
export function fmtMoney(amount: number | null | undefined, currency = 'EUR'): string {
  const v = amount ?? 0
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(v)
}

// Do total (com IVA) extrai a base tributável e o valor de IVA.
export function vatBreakdown(total: number, rate: number): { net: number; vat: number } {
  const r = rate / 100
  const net = r > 0 ? total / (1 + r) : total
  return { net, vat: total - net }
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const dt = new Date(d + (d.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(dt.getTime())) return d
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(dt)
}

// Bruto / deduções / líquido a partir das linhas do vencimento.
export function payrollTotals(lines: { kind: 'earning' | 'deduction'; amount: number }[]): { gross: number; deductions: number; net: number } {
  let gross = 0, deductions = 0
  for (const l of lines) {
    if (l.kind === 'deduction') deductions += Math.abs(l.amount || 0)
    else gross += l.amount || 0
  }
  return { gross, deductions, net: gross - deductions }
}

// ---- Períodos ----
export const PERIODS = [
  { key: 'all', label: 'Todo o período' },
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_month', label: 'Mês passado' },
  { key: 'this_quarter', label: 'Este trimestre' },
  { key: 'this_year', label: 'Este ano' },
  { key: 'custom', label: 'Personalizado' },
] as const

export function periodRange(period: string, from?: string, to?: string): { from: string | null; to: string | null } {
  const now = new Date(); const y = now.getFullYear(), m = now.getMonth()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const first = (yy: number, mm: number) => iso(new Date(yy, mm, 1))
  const last = (yy: number, mm: number) => iso(new Date(yy, mm + 1, 0))
  switch (period) {
    case 'this_month': return { from: first(y, m), to: last(y, m) }
    case 'last_month': return { from: first(y, m - 1), to: last(y, m - 1) }
    case 'this_quarter': { const q = Math.floor(m / 3) * 3; return { from: first(y, q), to: last(y, q + 2) } }
    case 'this_year': return { from: `${y}-01-01`, to: `${y}-12-31` }
    case 'custom': return { from: from || null, to: to || null }
    default: return { from: null, to: null }
  }
}

// dateStr dentro do intervalo? Sem data só passa quando não há intervalo (período = tudo).
export function inRange(dateStr: string | null | undefined, from: string | null, to: string | null): boolean {
  if (!dateStr) return from == null && to == null
  if (from && dateStr < from) return false
  if (to && dateStr > to) return false
  return true
}

// Vencimento de saída (só datas AAAA-MM-DD)
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function isExpenseOverdue(e: { status: string; due_date: string | null }): boolean {
  if (e.status === 'paid' || e.status === 'cancelled') return false
  return !!e.due_date && e.due_date < todayISO()
}

// ---- CSV (separador ';' + BOM, amigo do Excel PT) ----
export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [headers, ...rows].map(r => r.map(esc).join(';')).join('\r\n')
}
export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
