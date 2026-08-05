# VerumForma — App (gestão de obra)

Plataforma interna da VerumForma / Construzimbra. Substitui a versão atual em Base44
(app.verumforma.pt), que ficou limitada.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (auth + base de dados + storage)
- Deploy: Vercel

Mesma stack do `verumforma-website`, para consistência.

## Arranque local

```bash
npm install
cp .env.local.example .env.local   # preencher com as chaves do Supabase
npm run dev
```

Sem chaves do Supabase, a app arranca na mesma (modo aberto) para se poder ver o
esqueleto. Assim que as chaves são adicionadas, o login passa a ser obrigatório.

## Estrutura

- `app/(app)/` — área autenticada (shell com sidebar + topbar)
- `app/login/` — entrada
- `lib/supabase/` — clientes browser/server + middleware de sessão
- `supabase/` — migrações SQL (correr no SQL Editor do Supabase)

## Módulos (inventário do CRM atual, a migrar por fases)

Fase 1 — MVP dashboard e núcleo:
- Dashboard, Projetos, Tarefas, Calendário

Comercial:
- Clientes, Orçamentos, Fornecedores, Parceiros

Recursos:
- Equipa (Staff), Materiais, Assiduidade, Org Chart

Gestão:
- Finanças, Estatísticas, Investimentos, Mensagens, Logs, Definições

Bilingue (PT/EN), como a versão Base44.

## Estado

Esqueleto pronto a correr. Próximo: ligar o dashboard aos dados reais a partir do
export do Base44.
