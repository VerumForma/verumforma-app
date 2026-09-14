'use client'

import { useState } from 'react'
import MaterialsManager from './MaterialsManager'
import LabourManager from './LabourManager'
import CompositesManager from './CompositesManager'
import type { Material, Labour, Composite } from '@/lib/supabase/types'
import { Package, HardHat, Layers } from 'lucide-react'

type Supplier = { id: string; name: string }

export default function MaterialsWorkspace({ materials, labour, composites, costs, suppliers, matUsage = {}, labUsage = {}, compAlert = [], canEdit }: { materials: Material[]; labour: Labour[]; composites: Composite[]; costs: Record<string, number>; suppliers: Supplier[]; matUsage?: Record<string, number>; labUsage?: Record<string, number>; compAlert?: string[]; canEdit: boolean }) {
  const [tab, setTab] = useState<'materiais' | 'mao' | 'compostos'>('materiais')
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null)
  const tabCls = (a: boolean) => `inline-flex items-center gap-2 text-sm px-3.5 py-2.5 -mb-px border-b-2 transition-colors ${a ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[#1A1A1A]'}`
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="font-playfair text-3xl">Materiais</h1>
          <nav className="flex items-center gap-4 flex-wrap">
            <button onClick={() => setTab('materiais')} className={tabCls(tab === 'materiais')}><Package size={15} /> Materiais</button>
            <button onClick={() => setTab('mao')} className={tabCls(tab === 'mao')}><HardHat size={15} /> Mão de obra</button>
            <button onClick={() => setTab('compostos')} className={tabCls(tab === 'compostos')}><Layers size={15} /> Artigos compostos</button>
          </nav>
        </div>
        <div ref={setToolbarEl} className="flex items-center gap-2 flex-wrap" />
      </div>
      {tab === 'materiais' && <MaterialsManager initial={materials} suppliers={suppliers} usage={matUsage} canEdit={canEdit} toolbarSlot={toolbarEl} />}
      {tab === 'mao' && <LabourManager initial={labour} usage={labUsage} canEdit={canEdit} toolbarSlot={toolbarEl} />}
      {tab === 'compostos' && <CompositesManager initial={composites} costs={costs} alertIds={compAlert} canEdit={canEdit} toolbarSlot={toolbarEl} />}
    </div>
  )
}
