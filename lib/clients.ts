// Rótulos e cores partilhados do módulo Clientes.
export const STATUS_META: Record<string, { label: string; cls: string }> = {
  potencial: { label: 'Potencial', cls: 'bg-amber-100 text-amber-800' },
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-800' },
  inativo: { label: 'Inativo', cls: 'bg-[rgba(26,26,26,0.06)] text-[var(--muted)]' },
}
export const KIND_LABEL: Record<string, string> = { empresa: 'Empresa', individual: 'Individual' }
