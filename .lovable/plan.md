

# Plano: Despesas Fixas com Replicacao Automatica

## Resumo

Adicionar o conceito de "despesa fixa" ao sistema financeiro. Despesas marcadas como fixas (Aluguel, Internet, Sistemas, Contador, Salarios) sao automaticamente replicadas para os meses seguintes com valores editaveis. Cada ocorrencia mensal pode ser editada ou cancelada individualmente.

## Abordagem

Criar uma tabela `despesas_fixas` que armazena os modelos de despesas recorrentes. Uma funcao no frontend (ou edge function com cron) verifica ao abrir o modulo financeiro se ja existem ocorrencias geradas para o mes atual -- se nao, gera automaticamente na tabela `despesas` com base nos modelos ativos. Cada ocorrencia gerada e uma despesa normal, editavel e cancelavel, vinculada ao modelo original via `despesa_fixa_id`.

## Alteracoes

### 1. Migracao de banco de dados

Criar tabela `despesas_fixas`:
- `id` (uuid, PK)
- `descricao` (text) - ex: "Aluguel Escritorio"
- `valor` (numeric) - valor padrao mensal
- `categoria` (text) - categoria da despesa
- `conta` (text) - conta responsavel
- `dia_vencimento` (integer) - dia do mes para vencimento (1-31)
- `ativa` (boolean, default true) - se ainda esta ativa
- `observacoes` (text, nullable)
- `created_at`, `created_by`

Adicionar coluna na tabela `despesas`:
- `despesa_fixa_id` (uuid, nullable, FK para despesas_fixas) - vincula a ocorrencia ao modelo

RLS: mesmas politicas das outras tabelas financeiras.

### 2. Tipos TypeScript

Adicionar em `src/types/financeiro.ts`:
- Interface `DespesaFixa` com os campos acima
- Atualizar `Despesa` para incluir `despesa_fixa_id`

### 3. Hook `useDespesasFixas.ts`

Novo hook com:
- `useDespesasFixas()` - listar modelos ativos
- `useCreateDespesaFixa()` - criar novo modelo
- `useUpdateDespesaFixa()` - editar modelo (ex: reajuste de valor)
- `useDeleteDespesaFixa()` - desativar modelo (soft delete via `ativa = false`)
- `useGerarDespesasFixasMes()` - gera ocorrencias do mes atual para todas as fixas que ainda nao foram geradas

### 4. Logica de replicacao automatica

Ao carregar a aba de Despesas (ou o modulo financeiro), o sistema verifica:
1. Busca todas as `despesas_fixas` ativas
2. Para cada uma, verifica se ja existe uma `despesa` com `despesa_fixa_id = X` e `data` no mes/ano atual
3. Se nao existir, cria automaticamente com os dados do modelo
4. O dia de vencimento respeita o `dia_vencimento` do modelo

Isso e executado via hook `useGerarDespesasFixasMes` chamado no componente da aba Despesas.

### 5. Interface - Gerenciamento de despesas fixas

Novo componente `DespesasFixasManager.tsx` exibido na aba de Despesas:
- Card colapsavel "Despesas Fixas" no topo
- Lista os modelos ativos com valor, categoria, conta e dia de vencimento
- Botao "Nova Despesa Fixa" abre dialog de criacao
- Acoes por modelo: Editar (reajuste), Desativar
- Badge indicando se a ocorrencia do mes atual ja foi gerada

### 6. Dialog `NewDespesaFixaDialog.tsx`

Formulario com:
- Descricao
- Valor mensal
- Categoria (dropdown das categorias de despesa)
- Conta (dropdown Juliana/Liziane/Escritorio)
- Dia de vencimento (1-31)
- Observacoes

### 7. Indicador nas despesas geradas

Na tabela de despesas, ocorrencias geradas a partir de fixas mostram um badge/icone "Fixa" para identificar que vieram de um modelo recorrente.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | CREATE TABLE despesas_fixas + ALTER TABLE despesas |
| `src/types/financeiro.ts` | Adicionar DespesaFixa + despesa_fixa_id |
| `src/hooks/useDespesasFixas.ts` | NOVO - CRUD + geracao automatica |
| `src/components/financeiro/despesas/DespesasFixasManager.tsx` | NOVO - gerenciar modelos |
| `src/components/financeiro/despesas/NewDespesaFixaDialog.tsx` | NOVO - criar modelo |
| `src/components/financeiro/despesas/EditDespesaFixaDialog.tsx` | NOVO - editar modelo |
| `src/pages/Financeiro.tsx` | Adicionar DespesasFixasManager na aba Despesas |
| `src/components/financeiro/despesas/DespesasTable.tsx` | Badge "Fixa" nas ocorrencias |

## Detalhes Tecnicos

**Tabela despesas_fixas:**
```text
CREATE TABLE despesas_fixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric NOT NULL,
  categoria text NOT NULL,
  conta text DEFAULT 'escritorio',
  dia_vencimento integer NOT NULL DEFAULT 10,
  ativa boolean DEFAULT true,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE despesas ADD COLUMN despesa_fixa_id uuid REFERENCES despesas_fixas(id);
```

**Logica de geracao automatica (no hook):**
```text
async function gerarDespesasFixasMes() {
  const hoje = new Date();
  const mesAtual = format(hoje, 'yyyy-MM');
  
  // Buscar todas as fixas ativas
  const { data: fixas } = await supabase
    .from('despesas_fixas')
    .select('*')
    .eq('ativa', true);

  // Buscar despesas ja geradas neste mes
  const { data: jaGeradas } = await supabase
    .from('despesas')
    .select('despesa_fixa_id')
    .not('despesa_fixa_id', 'is', null)
    .gte('data', `${mesAtual}-01`)
    .lte('data', `${mesAtual}-31`);

  const idsJaGerados = new Set(jaGeradas?.map(d => d.despesa_fixa_id));

  // Gerar as que faltam
  const novas = fixas
    .filter(f => !idsJaGerados.has(f.id))
    .map(f => ({
      descricao: f.descricao,
      valor: f.valor,
      data: `${mesAtual}-${String(Math.min(f.dia_vencimento, 28)).padStart(2, '0')}`,
      categoria: f.categoria,
      conta: f.conta,
      status: 'pendente',
      despesa_fixa_id: f.id,
      observacoes: 'Gerada automaticamente - Despesa fixa',
    }));

  if (novas.length > 0) {
    await supabase.from('despesas').insert(novas);
  }
}
```

**Cancelar ocorrencia especifica:**
A despesa gerada e uma despesa normal na tabela `despesas`. Para cancelar, o usuario pode alterar o status para "cancelado" ou excluir a ocorrencia. Isso nao afeta o modelo nem as ocorrencias de outros meses.

**Editar valor (reajuste):**
Editar o modelo (`despesas_fixas`) altera o valor para as proximas geracoes. Ocorrencias ja geradas mantem o valor original (podem ser editadas individualmente).

## Resultado

- Despesas fixas (Aluguel, Internet, Sistemas, Contador, Salarios) sao cadastradas uma vez como modelos
- Todo mes, ao abrir o financeiro, as ocorrencias sao geradas automaticamente com status "pendente"
- Cada ocorrencia mensal pode ser editada (valor diferente) ou cancelada sem afetar outros meses
- Reajustes no modelo afetam apenas futuras geracoes
- Badge visual identifica despesas vindas de modelos fixos

