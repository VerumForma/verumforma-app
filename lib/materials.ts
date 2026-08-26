export const UNITS: { key: string; label: string }[] = [
  { key: 'un', label: 'un' }, { key: 'm', label: 'm' }, { key: 'm2', label: 'm²' },
  { key: 'm3', label: 'm³' }, { key: 'ml', label: 'ml' }, { key: 'kg', label: 'kg' },
  { key: 'saco', label: 'saco' }, { key: 'balde', label: 'balde' }, { key: 'carrinho', label: 'carrinho' },
  { key: 'tonelada', label: 'tonelada' }, { key: 'l', label: 'L' }, { key: 'hora', label: 'hora' }, { key: 'vg', label: 'vg' },
]
export const UNIT_LABEL: Record<string, string> = Object.fromEntries(UNITS.map(u => [u.key, u.label]))
export const eur = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

export function compositeCost(lines: { kind: string; quantity: number; price: number }[], wastePct: number) {
  const materials = lines.filter(l => l.kind === 'material').reduce((s, l) => s + l.quantity * (l.price || 0), 0)
  const labour = lines.filter(l => l.kind === 'labour').reduce((s, l) => s + l.quantity * (l.price || 0), 0)
  const composites = lines.filter(l => l.kind === 'composite').reduce((s, l) => s + l.quantity * (l.price || 0), 0)
  const sub = materials + labour + composites
  const waste = sub * ((wastePct || 0) / 100)
  return { materials, labour, composites, sub, waste, total: sub + waste }
}

type Breakdown = ReturnType<typeof compositeCost>
type ItemLite = { composite_id: string; kind: string; material_id: string | null; labour_id: string | null; composite_ref_id: string | null; quantity: number; unit: string | null }

// Custo real de cada artigo composto, resolvido recursivamente (compostos podem conter compostos).
export function buildCompositeCosts(
  composites: { id: string; waste_pct: number }[],
  items: ItemLite[],
  matPrice: Record<string, number>,
  labPrice: Record<string, number>,
  unitPer: Record<string, Record<string, number>>,
): Record<string, Breakdown> {
  const byId = Object.fromEntries(composites.map(c => [c.id, c]))
  const itemsByComp: Record<string, ItemLite[]> = {}
  for (const it of items) (itemsByComp[it.composite_id] ||= []).push(it)
  const memo: Record<string, Breakdown> = {}
  function cost(id: string, seen: Set<string>): Breakdown {
    if (memo[id]) return memo[id]
    const c = byId[id]
    if (!c || seen.has(id)) return compositeCost([], 0)
    const seen2 = new Set(seen); seen2.add(id)
    const lines = (itemsByComp[id] ?? []).map(it => {
      if (it.kind === 'material') { const per = it.unit ? (unitPer[it.material_id ?? '']?.[it.unit] ?? 1) : 1; return { kind: 'material', quantity: it.quantity / (per || 1), price: matPrice[it.material_id ?? ''] ?? 0 } }
      if (it.kind === 'labour') return { kind: 'labour', quantity: it.quantity, price: labPrice[it.labour_id ?? ''] ?? 0 }
      const child = it.composite_ref_id ? cost(it.composite_ref_id, seen2) : null
      return { kind: 'composite', quantity: it.quantity, price: child?.total ?? 0 }
    })
    const r = compositeCost(lines, c.waste_pct)
    memo[id] = r; return r
  }
  for (const c of composites) cost(c.id, new Set())
  return memo
}
