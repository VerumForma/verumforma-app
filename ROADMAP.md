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

## Orçamentos — margem e IVA (para quando construirmos) — 2026-08-05
- Orçamentos calculados SEMPRE sem IVA; IVA em vigor aplicado só na apresentação ao cliente.
- Dois preços por artigo: (1) CUSTO REAL, interno, sem lucro (soma da composição do material composto);
  (2) PREÇO FINAL ao cliente = custo real + coeficiente de lucro. O lucro é distribuído pelos artigos
  na preparação da entrega do orçamento. A margem vive no Orçamento; o material composto fica sempre a custo real.

## Materiais — notas de modelo — 2026-08-05
- Preços dos materiais simples e da mão de obra são alimentados pela FATURAÇÃO (leitura de faturas,
  artigo a artigo, por fornecedor). Cada material/mão de obra tem HISTÓRICO de preços + gráfico de flutuação
  (filtrável por todos / por fornecedor). Um material pode ter vários fornecedores.
- Mão de obra: €/hora calculado a partir do ordenado BRUTO (fórmula a definir depois). Catálogo próprio.
- Material composto = custo real (sem lucro), qty líquidas por componente + coeficiente de desperdício;
  mão de obra em horas decimais (0,25 = 15min).

## Módulos Stock e POS (Loja) — decisão 2026-08-27
- Decidido: dois módulos NOVOS — **Stock** e **POS (Loja)** — separados do módulo Materiais.
  Motivo: com a nova loja de Montijo passa a haver stock de material para venda + necessidade de POS.
- Materiais = CATÁLOGO (o que o artigo é + preço). Stock = QUANTIDADES por local + MOVIMENTOS (entradas/saídas).
  Não meter quantidades dentro de Materiais; o Stock é que gere o "inserir/retirar" estilo POS.
- Entrada de material (vinda de fornecedor) declara LOCAL DE APLICAÇÃO:
  (a) guardar em armazém — indicar o DEPARTAMENTO do armazém (estaleiro, carpintaria, estante XPTO…);
  (b) aplicar diretamente numa OBRA.
- Saídas de stock por MOTIVO: consumo em obra (project_id), venda ao cliente final (POS), transferência, ajuste/quebra.
  "Apontar X baldes a uma obra" = saída de stock com motivo=consumo + project_id (usa conversão de unidades já feita
  em material_units: stock vive na unidade base, o movimento entra em qualquer unidade e converte).
- POS tem de emitir documento fiscal CERTIFICADO pela AT (lei PT). NÃO construir emissão própria — integrar API de
  software certificado (candidatos a validar: Vendus (retalho+POS+hardware, API), Moloni, InvoiceXpress, Cegid/Sage).
  O nosso módulo POS = frontend de venda que chama a API certificada p/ o documento fiscal + regista saída de stock + recibo.
- Dependências: Stock depende de Materiais (feito) e liga a Finanças (compra→Despesa; venda→Recibo). project_id já
  preparado em Finanças e a preparar em Stock. Projetos ganha prioridade (necessário p/ "apontar a obra" ter destino real).
- Extração de fatura de fornecedor artigo-a-artigo (fase B do Smart Importer) passa a alimentar ENTRADAS de stock
  (com local de aplicação) além dos preços de Materiais.

## Ordem de construção acordada — 2026-08-27
1. Fechar/testar Finanças (migração 021 no Supabase + teste localhost).
2. **Projetos** (decidido próximo — é o hub; dá destino ao 'apontar à obra' do Stock e ao project_id das Finanças).
3. Stock.
4. Orçamentos.
5. POS (Loja) — depende de Stock + fornecedor certificado AT. Pesquisa de APIs certificadas (Vendus/Moloni/InvoiceXpress/Cegid) ADIADA a pedido do João (fica registada aqui).
6. Estatísticas (agrega tudo; encaixa quando houver dados).
