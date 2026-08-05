import { FolderKanban, FileText, ListChecks, Wallet } from 'lucide-react'

export const metadata = { title: 'Dashboard · VerumForma' }

const cards = [
  { label: 'Obras ativas', value: '—', icon: FolderKanban },
  { label: 'Orçamentos pendentes', value: '—', icon: FileText },
  { label: 'Tarefas por fazer', value: '—', icon: ListChecks },
  { label: 'A receber', value: '—', icon: Wallet },
]

export default function DashboardPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="font-playfair text-3xl mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Visão geral da operação. Os dados aparecem aqui assim que ligarmos os módulos.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{c.label}</span>
                <Icon size={18} />
              </div>
              <p className="font-playfair text-3xl">{c.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-8 text-center">
        <p className="font-playfair text-xl mb-2">MVP em construção</p>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
          Esqueleto pronto. Envia o que tens no Base44 e começamos a ligar os módulos, a começar pelo dashboard.
        </p>
      </div>
    </div>
  )
}
