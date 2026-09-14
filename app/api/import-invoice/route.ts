import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

let cachedModel: string | null = null

// Descobre um modelo válido na conta (prefere Sonnet). Fixável via ANTHROPIC_MODEL.
async function resolveModel(key: string, hq: boolean): Promise<string> {
  if (hq) return process.env.ANTHROPIC_MODEL_SONNET || 'claude-sonnet-5'
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL
  if (cachedModel) return cachedModel
  try {
    const r = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } })
    if (r.ok) {
      const j = await r.json() as { data?: { id: string }[] }
      const ids = (j.data ?? []).map(m => m.id)
      const pick = ids.find(i => /sonnet/i.test(i)) || ids.find(i => /opus/i.test(i)) || ids.find(i => /haiku/i.test(i)) || ids[0]
      if (pick) { cachedModel = pick; return pick }
    }
  } catch { /* cai no fallback */ }
  return process.env.ANTHROPIC_MODEL_SONNET || 'claude-sonnet-5'
}

function jsonFrom(text: string): Record<string, unknown> | null {
  // Tenta extrair o primeiro objeto JSON do texto do modelo.
  const a = text.indexOf('{'); const b = text.lastIndexOf('}')
  if (a === -1 || b === -1 || b < a) return null
  try { return JSON.parse(text.slice(a, b + 1)) } catch { return null }
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'Falta a ANTHROPIC_API_KEY no servidor.' }, { status: 500 })

  let file: File | null = null
  let kind = 'despesa'
  let hq = false
  try {
    const form = await req.formData()
    file = form.get('file') as File | null
    kind = (form.get('kind') as string) || 'despesa'
    hq = (form.get('hq') as string) === '1'
  } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ ok: false, error: 'Nenhum ficheiro recebido.' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length > 20 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'Ficheiro demasiado grande (máx. 20MB).' }, { status: 400 })
  const b64 = bytes.toString('base64')
  const mime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')

  const doc = mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } }

  const who = kind === 'recibo' ? 'cliente (a quem faturámos)' : 'fornecedor (quem nos emitiu a fatura)'
  const prompt = `És um assistente de contabilidade em Portugal. Analisa este documento de fatura e devolve APENAS um objeto JSON válido, sem texto à volta, com estes campos:
{
  "counterparty_name": string | null,   // nome do ${who}
  "counterparty_nif": string | null,     // NIF/Contribuinte do ${who}
  "counterparty_email": string | null,
  "counterparty_phone": string | null,
  "counterparty_address": string | null, // morada/rua
  "counterparty_city": string | null,
  "counterparty_country": string | null,
  "counterparty_website": string | null,
  "reference": string | null,            // número da fatura / documento
  "issue_date": string | null,           // data de emissão em formato AAAA-MM-DD
  "due_date": string | null,             // data limite de pagamento AAAA-MM-DD, se existir
  "amount_total": number | null,         // valor TOTAL com IVA, em número (usa ponto decimal)
  "vat_rate": number | null,             // taxa de IVA principal: 23, 13, 6 ou 0
  "currency": string | null,             // moeda, ex. EUR
  "description": string | null,          // breve descrição global do documento
  "items": [                             // UMA entrada por cada linha/artigo da fatura
    {
      "external_ref": string | null,     // código/referência do artigo NA fatura do fornecedor
      "description": string | null,      // designação do artigo
      "quantity": number | null,         // quantidade
      "unit_price": number | null,       // preço unitário (sem IVA se possível)
      "vat_rate": number | null          // taxa de IVA do artigo (23/13/6/0)
    }
  ]
}
Extrai TODAS as linhas de artigos da fatura, uma a uma. Se um campo não existir, usa null. Não inventes valores. Responde APENAS com o objeto JSON, sem texto antes ou depois e sem blocos de código.`

  const model = await resolveModel(key, hq)
  let resp: Response
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: [doc, { type: 'text', text: prompt }] }],
      }),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Não foi possível contactar a API de IA.' }, { status: 502 })
  }

  if (!resp.ok) {
    const t = await resp.text().catch(() => '')
    return NextResponse.json({ ok: false, error: `Erro da API de IA (${resp.status}). ${t.slice(0, 300)}` }, { status: 502 })
  }

  const data = await resp.json() as { content?: { type: string; text?: string }[]; stop_reason?: string }
  const text = (data.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? '').join('')
  const raw = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const parsed = jsonFrom(raw)
  if (!parsed) return NextResponse.json({ ok: false, error: `A IA não devolveu dados legíveis${data.stop_reason === 'max_tokens' ? ' (resposta cortada — demasiadas linhas)' : ''}. Início: ${raw.slice(0, 220)}` }, { status: 502 })

  return NextResponse.json({ ok: true, data: parsed })
}
