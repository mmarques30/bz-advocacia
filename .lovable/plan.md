

# Plano: Creditos Condicionais (Backlog Financeiro)

## Resumo

Criar uma funcionalidade de "creditos a receber condicionais" -- valores que dependem de eventos futuros do processo (liminar, sentenca, encerramento) e ficam em backlog ate que o evento ocorra. Quando ativados, tornam-se receitas normais com data definida.

## Como funciona

1. Advogada registra um credito condicional: "Honorarios de exito R$ 5.000 - condicionado a liminar no processo 1234567"
2. O credito fica com status **backlog** -- nao aparece em KPIs, graficos nem projecoes
3. Quando o evento ocorre, a advogada edita o credito para status **a_receber**, define a data e ele se torna um acordo financeiro normal
4. Tambem pode ser cancelado se o evento nao se concretizar

## Alteracoes

### 1. Banco de dados

Criar tabela `creditos_condicionais`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| cliente_id | uuid FK | Cliente vinculado |
| processo_id | uuid FK nullable | Processo vinculado |
| descricao | text | Ex: "Honorarios de exito" |
| valor | numeric | Valor estimado |
| conta | text | Conta responsavel (juliana/liziane/escritorio) |
| evento_gatilho | text | Ex: "Concessao de liminar" |
| status | text | backlog, a_receber, convertido, cancelado |
| data_ativacao | date nullable | Data em que foi ativado (quando sai de backlog) |
| observacoes | text nullable | Notas adicionais |
| acordo_id | uuid FK nullable | Acordo gerado ao converter |
| created_at | timestamptz | Data de criacao |
| created_by | uuid | Usuario que criou |

RLS habilitado com politica para usuarios autenticados.

### 2. Tipos TypeScript

Adicionar em `src/types/financeiro.ts`:
- Tipo `StatusCreditoCondicional = 'backlog' | 'a_receber' | 'convertido' | 'cancelado'`
- Interface `CreditoCondicional`
- Labels `STATUS_CREDITO_CONDICIONAL_LABELS`

### 3. Hook `useCreditosCondicionais.ts`

Novo hook com:
- `useCreditosCondicionais(filtros)` -- listar creditos com filtro por status
- `useCreateCreditoCondicional()` -- criar novo credito em backlog
- `useAtivarCredito()` -- mudar de backlog para a_receber com data
- `useConverterCredito()` -- converter em acordo financeiro real (cria acordo + parcela)
- `useCancelarCredito()` -- marcar como cancelado

### 4. Componentes de UI

**`CreditosCondicionaisSection.tsx`** -- Secao na aba Faturamento:
- Card colapsavel "Creditos Condicionais" com badge de contagem
- Tabela com: Cliente, Processo, Descricao, Evento Gatilho, Valor, Status, Acoes
- Acoes por credito: Ativar (definir data), Converter em Acordo, Cancelar
- Botao "Novo Credito Condicional"

**`NewCreditoCondicionalDialog.tsx`** -- Dialog de criacao:
- Campos: Cliente (dropdown), Processo (dropdown), Descricao, Valor, Conta, Evento Gatilho, Observacoes
- Status inicial sempre "backlog"

**`AtivarCreditoDialog.tsx`** -- Dialog para ativar:
- Mostra detalhes do credito
- Campo para data de ativacao (quando se torna exigivel)
- Opcao de converter diretamente em acordo

### 5. Integracao na pagina Financeiro

Adicionar `CreditosCondicionaisSection` na aba Faturamento, acima da tabela de faturamento -- similar ao `DespesasFixasManager` na aba Despesas.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | CREATE TABLE creditos_condicionais |
| `src/types/financeiro.ts` | Adicionar tipos CreditoCondicional |
| `src/hooks/useCreditosCondicionais.ts` | NOVO - CRUD + ativar/converter |
| `src/components/financeiro/CreditosCondicionaisSection.tsx` | NOVO - secao principal |
| `src/components/financeiro/NewCreditoCondicionalDialog.tsx` | NOVO - dialog criacao |
| `src/components/financeiro/AtivarCreditoDialog.tsx` | NOVO - dialog ativacao |
| `src/pages/Financeiro.tsx` | Adicionar secao na aba Faturamento |

## Detalhes Tecnicos

**Migracao SQL:**
```text
CREATE TABLE public.creditos_condicionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  processo_id uuid,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  conta text DEFAULT 'escritorio',
  evento_gatilho text NOT NULL,
  status text DEFAULT 'backlog',
  data_ativacao date,
  observacoes text,
  acordo_id uuid,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.creditos_condicionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage creditos_condicionais"
ON public.creditos_condicionais FOR ALL
USING (true) WITH CHECK (true);
```

**Conversao em acordo (no hook):**
```text
// Ao converter, cria um acordo financeiro real
const { data: acordo } = await supabase
  .from('acordos_financeiros')
  .insert({
    cliente_id: credito.cliente_id,
    processo_id: credito.processo_id,
    tipo_servico: credito.descricao,
    valor_total: credito.valor,
    forma_pagamento: 'a_vista',
    numero_parcelas: 1,
    data_primeiro_vencimento: credito.data_ativacao,
    conta: credito.conta,
  })
  .select().single();

// Cria parcela pendente
await supabase.from('parcelas_financeiras').insert({
  acordo_id: acordo.id,
  numero_parcela: 1,
  valor: credito.valor,
  data_vencimento: credito.data_ativacao,
  status: 'pendente',
});

// Atualiza credito como convertido
await supabase
  .from('creditos_condicionais')
  .update({ status: 'convertido', acordo_id: acordo.id })
  .eq('id', credito.id);
```

**Regra de negocio:**
- Creditos com status `backlog` NAO aparecem em KPIs, graficos ou projecoes
- Creditos com status `a_receber` aparecem apenas como informativo na secao (sem afetar projecoes ate serem convertidos)
- Somente creditos `convertido` geram impacto financeiro real (via acordo criado)
- Creditos `cancelado` ficam no historico mas sem impacto

## Resultado

- Advogadas podem registrar honorarios de exito e outros creditos condicionais sem poluir as projecoes financeiras
- Cada credito fica vinculado ao processo/cliente correspondente
- Quando o evento gatilho ocorre, basta ativar e converter em acordo real
- Historico completo de creditos condicionais (backlog, ativados, convertidos, cancelados)
