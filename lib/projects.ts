// Rótulos, cores e estados do módulo Projetos (obras).
export const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  adjudicado: { label: 'Adjudicado', cls: 'bg-blue-100 text-blue-800' },
  em_curso: { label: 'Em curso', cls: 'bg-green-100 text-green-800' },
  pausado: { label: 'Pausado', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
  concluido: { label: 'Concluído', cls: 'bg-[#1A1A1A] text-white' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-800' },
}
export const PROJECT_STATUSES = ['adjudicado', 'em_curso', 'pausado', 'concluido', 'cancelado'] as const

// Estados considerados "ativos" (a decorrer) para efeitos de contagem/resumo.
export const ACTIVE_STATUSES = new Set(['adjudicado', 'em_curso', 'pausado'])
