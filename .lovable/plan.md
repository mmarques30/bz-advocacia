

## Plano: Página "Atualizações" com análise de melhorias por IA

### Objetivo
Criar uma nova página em Administrativo > Atualizações onde a administradora clica um botão, a IA analisa as mudanças recentes no sistema (logs_sistema) e gera um texto acessível para copiar e enviar aos clientes. Todas as análises ficam salvas em um histórico.

### 1. Banco de Dados
Criar tabela `atualizacoes_sistema`:
- `id` uuid PK
- `periodo` text (dia/semana/mes)
- `data_inicio` date
- `data_fim` date
- `conteudo` text (texto gerado pela IA)
- `created_by` uuid
- `created_at` timestamptz

RLS: authenticated users can read/insert.

### 2. Edge Function `analyze-updates`
Nova edge function que:
1. Recebe `periodo` (dia/semana/mes), calcula range de datas
2. Consulta `logs_sistema` no período (ações de criar/editar/deletar)
3. Agrupa por entidade_tipo e ação, monta resumo
4. Envia ao Lovable AI (gemini-3-flash-preview) com prompt para gerar texto acessível, profissional, em português, pronto para enviar a clientes
5. Salva resultado na tabela `atualizacoes_sistema`
6. Retorna o texto gerado

### 3. Nova Página `src/pages/configuracoes/Atualizacoes.tsx`
- Duas abas internas: **Gerar Atualização** e **Histórico**
- Aba "Gerar": 3 botões (Hoje / Última Semana / Último Mês), ao clicar chama a edge function, exibe o texto gerado com botão "Copiar"
- Aba "Histórico": lista todas as análises anteriores da tabela `atualizacoes_sistema`, com data, período e conteúdo expandível

### 4. Routing e Sidebar
- Adicionar rota `/dashboard/configuracoes/atualizacoes` no `App.tsx`
- Adicionar submenu "Atualizações" no `AppSidebar.tsx` abaixo de "Listas do Sistema"
- Adicionar card na página índice de Configurações

### Arquivos a criar/editar
- **Criar**: `src/pages/configuracoes/Atualizacoes.tsx`
- **Criar**: `supabase/functions/analyze-updates/index.ts`
- **Editar**: `src/App.tsx` (nova rota)
- **Editar**: `src/components/AppSidebar.tsx` (submenu)
- **Editar**: `src/pages/configuracoes/index.tsx` (card)
- **Migração**: criar tabela `atualizacoes_sistema`

