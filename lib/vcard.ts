// Geração de vCard (.vcf) a partir de entidades/contactos. Tipos estruturais
// para servir clientes, fornecedores, etc.

type VEntity = {
  name: string; company?: string | null; kind?: string | null
  email?: string | null; phone?: string | null
  address?: string | null; city?: string | null; country?: string | null
  website?: string | null; nif?: string | null; notes?: string | null
}
type VPerson = {
  name: string; role?: string | null; email?: string | null; phone?: string | null; notes?: string | null
}

function esc(v?: string | null): string {
  return String(v ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
function build(lines: (string | null | undefined)[]): string {
  return ['BEGIN:VCARD', 'VERSION:3.0', ...lines.filter(Boolean), 'END:VCARD'].join('\r\n')
}

export function buildEntityVCard(c: VEntity): string {
  const org = c.company || (c.kind === 'empresa' ? c.name : '')
  return build([
    `FN:${esc(c.name)}`,
    `N:;${esc(c.name)};;;`,
    org ? `ORG:${esc(org)}` : null,
    c.email ? `EMAIL;TYPE=INTERNET:${esc(c.email)}` : null,
    c.phone ? `TEL;TYPE=CELL:${esc(c.phone)}` : null,
    (c.address || c.city || c.country) ? `ADR;TYPE=WORK:;;${esc(c.address)};${esc(c.city)};;;${esc(c.country)}` : null,
    c.website ? `URL:${esc(c.website)}` : null,
    c.nif ? `NOTE:NIF ${esc(c.nif)}${c.notes ? '\\n' + esc(c.notes) : ''}` : (c.notes ? `NOTE:${esc(c.notes)}` : null),
  ])
}

export function buildContactVCard(c: VPerson, orgName?: string): string {
  return build([
    `FN:${esc(c.name)}`,
    `N:;${esc(c.name)};;;`,
    orgName ? `ORG:${esc(orgName)}` : null,
    c.role ? `TITLE:${esc(c.role)}` : null,
    c.email ? `EMAIL;TYPE=INTERNET:${esc(c.email)}` : null,
    c.phone ? `TEL;TYPE=CELL:${esc(c.phone)}` : null,
    c.notes ? `NOTE:${esc(c.notes)}` : null,
  ])
}

export function downloadVCard(filename: string, vcard: string) {
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace(/[^\w.\- ]+/g, '_')
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
