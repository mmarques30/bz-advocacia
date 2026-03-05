

## Diagnóstico

O problema fundamental: o `logs_sistema` registra apenas operações de banco de dados (editar lead, criar parcela, etc). Mudanças de código (correção de bugs, reorganização de menus, novas páginas) **não existem em nenhuma tabela do banco**. O campo de descrição manual exige trabalho que você não quer fazer.

## Solução: Registro automático de melhorias

Criar uma tabela `melhorias_registro` onde as melhorias são registradas programaticamente. Após cada sessão de desenvolvimento comigo, eu registro as mudanças feitas nessa tabela. A edge function `analyze-updates` lê dessa tabela ao invés de depender apenas dos `logs_sistema`.

### Mudanças

**1. Nova tabela `melhorias_registro`**
- `id`, `titulo` (text), `descricao` (text), `tipo` (enum: correção/melhoria/nova_funcionalidade), `data_implementacao` (date), `created_at`
- RLS: leitura para autenticados, inserção via service role

**2. Edge function `analyze-updates`**
- Consultar `melhorias_registro` no período selecionado (ao invés de `logs_sistema`)
- Montar o prompt da IA com as melhorias reais encontradas
- Remover a dependência do campo `descricao_manual` e do textarea

**3. Página `Atualizacoes.tsx`**
- Remover o textarea de descrição manual (não será mais necessário)
- Manter apenas os botões de período (Hoje/Semana/Mês)
- Adicionar seção para visualizar melhorias registradas no período

**4. Popular a tabela agora**
- Inserir as melhorias feitas nesta sessão:
  - Correção do campo advogada_responsavel com valor padrão
  - Adição da página de Atualizações do Sistema
  - Reorganização do menu Administrativo em 3 submenus (Cadastros, Modelos, Controle)
  - Remoção do card de Convites Pendentes

### Fluxo futuro
Após cada sessão de desenvolvimento, eu insiro automaticamente as melhorias na tabela. Quando você clica "Gerar Atualização", a IA transforma essas melhorias em texto profissional para o cliente.

