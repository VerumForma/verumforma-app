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
