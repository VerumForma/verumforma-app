'use client'

import { ExternalLink } from 'lucide-react'

// Mostra uma morada como link que abre no Google Maps (app no telemóvel, site no desktop).
// Aceita partes soltas (parts) ou uma string já montada (query). Se vazia, mostra '—'.
export default function MapsLink({ parts, query, className, showIcon = true }: {
  parts?: (string | null | undefined | false)[]
  query?: string
  className?: string
  showIcon?: boolean
}) {
  const q = (query ?? (parts ?? []).filter(Boolean).join(', ')).trim()
  if (!q || q === '—') return <span className={className}>—</span>
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
  return (
    <a href={href} target="_blank" rel="noreferrer" title="Abrir no Google Maps"
      className={`inline-flex items-center gap-1.5 hover:text-[#1A1A1A] hover:underline transition-colors ${className ?? ''}`}>
      <span>{q}</span>{showIcon && <ExternalLink size={12} className="shrink-0 opacity-60" />}
    </a>
  )
}
