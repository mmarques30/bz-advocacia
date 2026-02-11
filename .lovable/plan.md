
# Plano: Gerenciamento de Listas Suspensas na Area Administrativa

## Resumo

Criar uma pagina administrativa para gerenciar todas as listas suspensas (dropdowns) do sistema. As opcoes serao armazenadas no banco de dados, permitindo que as advogadas adicionem, editem e removam opcoes sem necessidade de alteracao de codigo.

## Listas a serem gerenciadas

1. **Origem de Leads** - google, facebook, instagram, tiktok, linkedin, indicacao, site, whatsapp_bot, outro
2. **Tipo de Processo** - Divorcio Consensual, Divorcio Litigioso, Inventario, Pensao Alimenticia, Uniao Estavel, Outro
3. **Categoria de Despesas** - aluguel_condominio, salarios_encargos, honorarios_terceiros, etc.
4. **Categoria de Tarefas** - processos, vendas, pagamentos, administrativo, geral

## Alteracoes

### 1. Migracao de banco de dados

Criar tabela `opcoes_sistema` com as colunas:
- `id` (uuid, PK)
- `grupo` (text) - identifica qual dropdown (ex: 'origem_lead', 'tipo_processo', 'categoria_despesa', 'categoria_tarefa')
- `valor` (text) - valor interno/codigo (ex: 'google', 'facebook')
- `label` (text) - texto exibido ao usuario (ex: 'Google', 'Facebook')
- `ordem` (integer) - ordem de exibicao
- `ativo` (boolean, default true) - permite desativar sem excluir
- `created_at` (timestamptz)

Inserir os valores atuais como seed inicial.

RLS: somente usuarios autenticados podem ler; somente admins podem modificar.

### 2. Hook `useOpcoesSistema` (`src/hooks/useOpcoesSistema.ts`)

- Query para buscar opcoes por grupo
- Mutations para criar, atualizar, reordenar e desativar opcoes
- Cache por grupo com invalidacao seletiva

### 3. Pagina administrativa (`src/pages/configuracoes/ListasSuspensas.tsx`)

- Interface com abas para cada grupo de opcoes
- Cada aba mostra uma lista de opcoes com:
  - Campo de label editavel inline
  - Valor/codigo (somente leitura apos criacao)
  - Toggle ativo/inativo
  - Botao para excluir (somente se nao estiver em uso)
  - Botao para adicionar nova opcao
  - Drag-and-drop para reordenar (usando dnd-kit ja instalado)

### 4. Rota e navegacao

- Nova rota: `/dashboard/configuracoes/listas`
- Adicionar no sidebar em "Administrativo": "Listas do Sistema"
- Adicionar card na pagina index de configuracoes

### 5. Integracao com componentes existentes

Atualizar os seguintes componentes para consumir opcoes do banco em vez de constantes hardcoded:

- `NewLeadDialog.tsx` - dropdown de origem
- `LeadsFilters.tsx` - checkboxes de origem
- `DemandasFilters.tsx` - dropdown de categoria
- `NewDemandaDialog.tsx` - dropdown de categoria
- `NewDespesaDialog.tsx` - dropdown de categoria de despesa
- `DespesasGlobalFilters.tsx` - dropdown de categoria de despesa

Os tipos TypeScript (`LeadOrigem`, `CategoriaDespesa`, etc.) continuam existindo como fallback, mas a fonte primaria passa a ser o banco.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabela `opcoes_sistema` + seed com valores atuais + RLS |
| `src/hooks/useOpcoesSistema.ts` | Novo hook para CRUD de opcoes |
| `src/pages/configuracoes/ListasSuspensas.tsx` | Nova pagina de gerenciamento |
| `src/App.tsx` | Adicionar rota `/dashboard/configuracoes/listas` |
| `src/components/AppSidebar.tsx` | Adicionar link "Listas do Sistema" no menu Administrativo |
| `src/pages/configuracoes/index.tsx` | Adicionar card de acesso |
| `src/components/leads/NewLeadDialog.tsx` | Consumir opcoes do banco para origem |
| `src/components/leads/LeadsFilters.tsx` | Consumir opcoes do banco para origem |
| `src/components/demandas/DemandasFilters.tsx` | Consumir opcoes do banco para categoria |
| `src/components/demandas/NewDemandaDialog.tsx` | Consumir opcoes do banco para categoria |
| `src/components/financeiro/despesas/NewDespesaDialog.tsx` | Consumir opcoes do banco para categoria despesa |
| `src/components/financeiro/DespesasGlobalFilters.tsx` | Consumir opcoes do banco para categoria despesa |

## Detalhes Tecnicos

**Estrutura da tabela:**
```text
opcoes_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo TEXT NOT NULL,           -- 'origem_lead', 'tipo_processo', 'categoria_despesa', 'categoria_tarefa'
  valor TEXT NOT NULL,           -- codigo interno (ex: 'google')
  label TEXT NOT NULL,           -- texto visivel (ex: 'Google')
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo, valor)
)
```

**Seed inicial (exemplo):**
```text
INSERT INTO opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('origem_lead', 'google', 'Google', 1),
  ('origem_lead', 'facebook', 'Facebook', 2),
  ('origem_lead', 'instagram', 'Instagram', 3),
  ...
  ('tipo_processo', 'divorcio_consensual', 'Divórcio Consensual', 1),
  ...
  ('categoria_despesa', 'aluguel_condominio', 'Aluguel e Condomínio', 1),
  ...
  ('categoria_tarefa', 'processos', 'Processos', 1),
  ...
```

**Hook de consumo nos componentes:**
```text
const { data: origensLead } = useOpcoesSistema('origem_lead');
// retorna: [{ valor: 'google', label: 'Google' }, ...]
// Usado no <SelectItem value={opcao.valor}>{opcao.label}</SelectItem>
```

**Interface da pagina:**
```text
Abas: [Origem de Leads] [Tipo de Processo] [Categoria de Despesas] [Categoria de Tarefas]

Cada aba:
+--------------------------------------------------+
| Label              | Codigo    | Ativo | Acoes    |
|--------------------+-----------+-------+----------|
| Google             | google    |  [x]  | Editar   |
| Facebook           | facebook  |  [x]  | Editar   |
| Instagram          | instagram |  [x]  | Editar   |
+--------------------------------------------------+
[+ Adicionar nova opcao]
```

## Resultado

- Administradoras podem adicionar, editar e desativar opcoes de dropdowns sem mexer no codigo
- Novas origens de lead, tipos de processo e categorias aparecem automaticamente em todos os formularios e filtros
- Opcoes desativadas deixam de aparecer em novos cadastros mas nao afetam registros existentes
- Dados historicos permanecem integros mesmo apos remocao de opcoes
