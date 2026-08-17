export { STATUS_META, KIND_LABEL } from './clients'

export const PARTNER_TYPES: { key: string; label: string }[] = [
  { key: 'subempreiteiro', label: 'Subempreiteiro' },
  { key: 'consultor', label: 'Consultor' },
  { key: 'fornecedor', label: 'Parceiro Fornecedor' },
  { key: 'joint_venture', label: 'Joint Venture' },
  { key: 'outro', label: 'Outro' },
]
export const PARTNER_TYPE_LABEL: Record<string, string> = Object.fromEntries(PARTNER_TYPES.map(t => [t.key, t.label]))
