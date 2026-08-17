export { STATUS_META, KIND_LABEL } from './clients'

export const SUPPLIES: { key: string; label: string }[] = [
  { key: 'materiais', label: 'Materiais' },
  { key: 'mao_obra', label: 'Mão de obra' },
  { key: 'servicos', label: 'Serviços / Consultoria' },
  { key: 'equipamento', label: 'Equipamento / Aluguer' },
]
export const SUPPLY_LABEL: Record<string, string> = Object.fromEntries(SUPPLIES.map(s => [s.key, s.label]))
