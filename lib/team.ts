export const STATUS_META: Record<string, { label: string; cls: string }> = {
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-800' },
  inativo: { label: 'Inativo', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
  licenca: { label: 'De Licença', cls: 'bg-amber-100 text-amber-800' },
}
export const DEPARTMENTS: { key: string; label: string }[] = [
  { key: 'gestao', label: 'Gestão' },
  { key: 'administracao', label: 'Administração' },
  { key: 'orcamentacao', label: 'Orçamentação' },
  { key: 'compras', label: 'Compras' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'construcao', label: 'Construção' },
  { key: 'outro', label: 'Outro' },
]
export const DEPT_LABEL: Record<string, string> = Object.fromEntries(DEPARTMENTS.map(d => [d.key, d.label]))
export const CONTRACT_TYPES: { key: string; label: string }[] = [
  { key: 'efetivo', label: 'Efetivo' },
  { key: 'termo_certo', label: 'Termo certo' },
  { key: 'termo_incerto', label: 'Termo incerto' },
  { key: 'recibos_verdes', label: 'Recibos verdes' },
  { key: 'temporario', label: 'Temporário' },
]
export const CONTRACT_LABEL: Record<string, string> = Object.fromEntries(CONTRACT_TYPES.map(c => [c.key, c.label]))
export const DRIVING_CATEGORIES = ['Ligeiros', 'Pesados', 'Reboque', 'Máquinas']
