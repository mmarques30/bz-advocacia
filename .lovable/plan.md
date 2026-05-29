## Problemas identificados

**1. Categorias de despesa duplicadas** — a tabela `opcoes_sistema` (grupo `categoria_despesa`) tem 19 entradas, com duplicatas conceituais:

| Manter (canônico) | Excluir (duplicata) |
|---|---|
| `aluguel_condominio` → label "Aluguel" | `aluguel` |
| `salarios_encargos` → label "Folha de Pagamento" | `folha_pagamento` |
| `impostos_taxas` → label "Impostos" | `impostos` |
| `tecnologia` → label "Tecnologia" | `tecnologia_ia` |
| `marketing_publicidade` → label "Marketing" | `marketing` |
| `telefonia_internet` → label "Telefonia" | `telefonia` |
| `energia_agua` → label "Energia" | `energia` |
| `materiais_expediente` → label "Material de Escritório" | `material_escritorio` |

Verifiquei o banco: **nenhuma despesa lançada usa os valores duplicados** (todas as 8 despesas/despesas_fixas existentes já usam os valores canônicos). A remoção é segura, sem perda de dados.

**2. Listas sem ordem alfabética nem busca** — os dropdowns de cliente (Novo Contrato Financeiro, Nova Entrada de Faturamento, Crédito Condicional) e de categoria de despesa usam `<Select>` simples do Radix, sem campo de busca e sem ordenação. Em listas grandes (centenas de clientes), fica impossível encontrar.

## O que vou fazer

### 1. Migração de banco — limpar e padronizar categorias
- Excluir as 8 linhas duplicadas de `opcoes_sistema` (grupo `categoria_despesa`).
- Atualizar `label` das canônicas para a versão curta preferida (Aluguel, Folha de Pagamento, Impostos, Tecnologia, Marketing, Telefonia, Energia).
- Reatribuir `ordem` para refletir ordem alfabética dos labels finais.

### 2. Componente Combobox de cliente reutilizável
Criar `src/components/ui/cliente-combobox.tsx` baseado no `cmdk`/`Popover` (mesmo padrão do shadcn Combobox), com:
- Busca por nome (case/acento-insensível).
- Ordenação alfabética automática.
- Mesmo visual dos `Select` atuais (altura `h-9`, texto `text-xs`, tokens semânticos).
- Props: `value`, `onChange`, `clientes`, `placeholder`, `disabled`.

### 3. Aplicar o Combobox onde o usuário reclamou
- `src/components/financeiro/NewAcordoDialog.tsx` → cliente (queixa principal).
- `src/components/financeiro/NewEntradaFaturamentoDialog.tsx` → cliente.
- `src/components/financeiro/NewCreditoCondicionalDialog.tsx` → cliente.

### 4. Tornar a lista de categoria de despesa buscável e ordenada
- `src/components/financeiro/despesas/NewDespesaDialog.tsx`: substituir o `<Select>` de Categoria por um Combobox equivalente, ordenando `categoriasEntries` por label (pt-BR, localeCompare).
- `src/components/financeiro/despesas/NewDespesaFixaDialog.tsx`: mesmo tratamento (consistência).

### 5. Garantir ordenação alfabética dos clientes na fonte
No `useLeads` (ou nos consumidores acima), aplicar `.sort((a,b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'))` antes de passar para o Combobox, já que hoje a query ordena por `data_ultima_atividade`.

## Fora de escopo
- Não vou mexer no `GerarContratoForm` / `GerarProcuracaoForm` (não foram citados; têm seus próprios fluxos de cliente que podem incluir mais de uma fonte).
- Não vou alterar o enum TypeScript `CategoriaDespesa` nem o fallback em `types/financeiro.ts` — o banco vira fonte única de verdade via `useOpcoesSistema`, e o fallback existente permanece como rede de segurança.

## Validação
- Reabrir o modal "Detalhes da Despesa" → a lista de Categoria mostra só uma de cada (Aluguel, Folha de Pagamento, Impostos, Tecnologia) em ordem alfabética, com campo de busca.
- Abrir "Novo Contrato Financeiro" → digitar parte do nome filtra a lista; nomes vêm ordenados de A a Z.