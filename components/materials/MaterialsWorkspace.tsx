'use client'

import { useState } from 'react'
import MaterialsManager from './MaterialsManager'
import LabourManager from './LabourManager'
import CompositesManager from './CompositesManager'
import type { Material, Labour, Composite } from '@/lib/supabase/types'
import { Package, HardHat, Layers } from 'lucide-react'

type Supplier = { id: string; name: string }

export default function MaterialsWorkspace({ materials, labour, composites, costs, suppliers, canEdit }: { materials: Material[]; labour: Labour[]; composites: Composite[]; costs: Record<string, number>; suppliers: Supplier[]; canEdit: boolean }) {
  const [tab, setTab] = useState<'materiais' | 'mao' | 'compostos'>('materiais')
  const tabCls = (a: boolean) => `inline-flex items-center gap-2 text-sm px-3.5 py-2.5 -mb-px border-b-2 transition-colors ${a ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`
  return (
    <div className="w-full">
      <h1 className="font-playfair text-3xl mb-1">Materiais</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Materiais simples, mão de obra e artigos compostos. Os preços passam a ser alimentados pelas faturas quando a Faturação existir.</p>
      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 flex-wrap">
        <button onClick={() => setTab('materiais')} className={tabCls(tab === 'materiais')}><Package size={15} /> Materiais</button>
        <button onClick={() => setTab('mao')} className={tabCls(tab === 'mao')}><HardHat size={15} /> Mão de obra</button>
        <button onClick={() => setTab('compostos')} className={tabCls(tab === 'compostos')}><Layers size={15} /> Artigos compostos</button>
      </div>
      {tab === 'materiais' && <MaterialsManager initial={materials} suppliers={suppliers} canEdit={canEdit} />}
      {tab === 'mao' && <LabourManager initial={labour} canEdit={canEdit} />}
      {tab === 'compostos' && <CompositesManager initial={composites} costs={costs} canEdit={canEdit} />}
    </div>
  )
}
