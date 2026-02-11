
# Plano: Dividir Origem em Categoria + Descricao

## Resumo

Separar a origem do lead em dois campos: "Origem" (categoria padronizada com novas opcoes como Facebook, Instagram) e "Descricao da Origem" (campo livre para detalhe como "Parceiro Joao", "Campanha Verao"). Reutilizar a coluna existente `outro_como_conheceu` no banco de dados para armazenar a descricao, sem necessidade de migracao.

## Situacao Atual

- Campo `origem` no banco: texto livre com default 'site'
- Campo `outro_como_conheceu`: existe no banco mas nao e utilizado na interface
- `LeadOrigem` no TypeScript: `google | meta | indicacao | site | whatsapp_bot | outro`
- Formularios e tabelas exibem apenas o campo de categoria

## Alteracoes

### 1. Expandir categorias de origem (`src/types/leads.ts`)

Atualizar `LeadOrigem` e `ORIGEM_LABELS`:

- Separar `meta` em `facebook` e `instagram`
- Adicionar `tiktok` e `linkedin`
- Manter: `google`, `indicacao`, `site`, `whatsapp_bot`, `outro`
- Adicionar campo `origem_descricao` na interface `Lead` (mapeado para `outro_como_conheceu` no banco)

### 2. Formulario de criacao/edicao (`src/components/leads/NewLeadDialog.tsx`)

- Adicionar campo `origem_descricao` ao schema do formulario (campo texto livre, opcional)
- Exibir o campo abaixo do seletor de Origem com placeholder contextual: "Ex: Parceiro Joao, Campanha Verao 2025"
- No submit, salvar em `outro_como_conheceu` no banco

### 3. Exibicao nas tabelas (`LeadsTable.tsx`, `ClientesTable.tsx`)

- Ao lado do badge de origem, exibir a descricao (se existir) como texto menor/secundario
- Formato: [Badge Indicacao] Parceiro Joao

### 4. Detalhes do lead (`LeadDetailsDialog.tsx`)

- Exibir "Origem" com badge + descricao na secao de informacoes

### 5. Filtros (`LeadsFilters.tsx`, `ClientesFilters.tsx`)

- Atualizar lista de checkboxes com as novas categorias de origem

### 6. Hook useLeads (`src/hooks/useLeads.ts`)

- Mapear `outro_como_conheceu` para `origem_descricao` no retorno dos dados

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/types/leads.ts` | Expandir `LeadOrigem`, `ORIGEM_LABELS`, adicionar campo `origem_descricao` |
| `src/components/leads/NewLeadDialog.tsx` | Adicionar campo de descricao da origem no form |
| `src/components/leads/LeadsTable.tsx` | Exibir descricao junto ao badge |
| `src/components/leads/ClientesTable.tsx` | Exibir descricao junto ao badge |
| `src/components/leads/LeadDetailsDialog.tsx` | Exibir descricao na aba informacoes |
| `src/components/leads/LeadsFilters.tsx` | Atualizar categorias |
| `src/components/clientes/ClientesFilters.tsx` | Atualizar categorias |
| `src/hooks/useLeads.ts` | Mapear outro_como_conheceu para origem_descricao |

## Detalhes Tecnicos

**Novas categorias de LeadOrigem:**
```text
google | facebook | instagram | tiktok | linkedin | indicacao | site | whatsapp_bot | outro
```

**Mapeamento no banco (sem migracao):**
```text
origem (campo existente) -> categoria padronizada
outro_como_conheceu (campo existente) -> descricao livre
```

**No formulario (submit):**
```text
origem: values.origem
outro_como_conheceu: values.origem_descricao || null
como_conheceu: values.origem
```

**Na interface Lead:**
```text
origem_descricao: string | null  // mapeado de outro_como_conheceu
```

**Exibicao na tabela:**
```text
<Badge>{ORIGEM_LABELS[lead.origem]}</Badge>
{lead.origem_descricao && <span className="text-xs text-muted-foreground ml-1">{lead.origem_descricao}</span>}
```

## Resultado

- Origem dividida em categoria padronizada + descricao livre
- Novas categorias: Facebook, Instagram, TikTok, LinkedIn
- Campo de descricao permite detalhar parcerias e campanhas especificas
- Dados padronizados viabilizam graficos e relatorios por canal
- Sem necessidade de migracao (reutiliza coluna existente)
