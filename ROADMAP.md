# VerumForma App — Roadmap / Ideias futuras

Notas de direção. Não implementar já, mas construir o presente sem fechar portas a isto.

## Smart Importer (Gmail → contacto)
- Integração com a API do Gmail das contas oficiais para ler/responder a emails dentro da app.
- Em cada email, botão "Gravar contacto" que extrai os dados (AI ou algoritmo) e cria uma ficha.
- Ao clicar, abre submenu: "+ Cliente", "+ Fornecedor", "+ Parceiro", etc. → decide para que entidade vai.
- Implicações no presente:
  - Manter clientes/fornecedores/parceiros com a MESMA forma de campos base (name, company, kind,
    nif, email, phone, address, city, country, website, notes, languages) → o importer escreve em
    qualquer tabela com o mesmo objeto extraído.
  - O flag `incomplete` (default true) encaixa perfeitamente: contactos importados por AI entram
    marcados como incompletos até revisão humana.
  - Precisa de OAuth + Gmail API (marco próprio; ver connector no futuro).

## Exportar contacto para o telemóvel (vCard) — IMPLEMENTADO (2026-08-05)
- Abrir uma ficha e "Exportar para lista de contactos" (iOS/Android).
- Solução: gerar um ficheiro **vCard (.vcf)** — importado nativamente por iOS e Android.
- Implicações no presente:
  - Os nossos campos já mapeiam 1:1 para vCard: name→FN, company→ORG, email→EMAIL, phone→TEL,
    address/city/country→ADR, website→URL, notes→NOTE.
  - Feito: botão 'Exportar' na ficha do cliente e por contacto interno (lib/vcard.ts). Gera .vcf.
    Funciona no desktop (abre a app Contactos) e no telemóvel.

## Outros diferidos
- Editor visual da matriz de permissões (quando houver 2-3 módulos).
- Dashboard interativo/editável (KPIs + quick links) — construir à medida que os módulos nascem.

## Decisões de módulos (2026-08-05)
- Orçamentos: UM módulo com direção (recebidos de fornecedores / enviados a clientes), filtrável.
- Faturação: livro de TODOS os movimentos bancários da empresa (ordenados, pagamentos, recibos).
  Cada registo = info base + ficheiro anexo (fatura fornecedor / fatura a cliente / recibo contabilidade).
  Faturas de fornecedores serão lidas artigo-a-artigo para alimentar o catálogo de Materiais. (Depois.)
- Fornecedores: separadores Projetos / Orçamentos / Materiais / Finanças são VISTAS de ligação
  filtradas por fornecedor_id (sem tabelas duplicadas). Campo "Fornece" (materiais/mao_obra/servicos/
  equipamento); mão de obra tem caixa extra para o tipo.

## Criar entidade a partir de fatura (extensão do Smart Importer) — 2026-08-05
- Fornecedores e Parceiros podem ter faturas associadas.
- Fluxo: entra fatura no módulo de Faturação → leitura algorítmica coloca-a no sítio certo e
  extrai artigos/materiais → se detetar fornecedor/parceiro NOVO, propõe criar a entidade já
  pré-preenchida com os dados da fatura, à espera de confirmação final do utilizador.
- Reforça: (1) mesma forma de campos base entre clientes/fornecedores/parceiros; (2) flag
  `incomplete` para entidades criadas por extração automática (entram a amarelo até revisão).
