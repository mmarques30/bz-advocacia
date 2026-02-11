
# Sincronizar Permissoes com o Menu Lateral

## Problema

O editor de permissoes de usuario (`PagePermissionsEditor`) ainda exibe itens que nao existem mais no menu e nao inclui itens que foram adicionados. Existem 3 divergencias:

| Situacao | Item | Acao |
|----------|------|------|
| Permissao existe, menu nao | `gestao_vendas.analises` ("Analises" em Gestao de Vendas) | Remover da lista de permissoes |
| Permissao existe, menu nao | `gestao_clientes.processos` ("Processos" em Gestao de Clientes) | Remover da lista de permissoes |
| Menu existe, permissao nao | "Listas do Sistema" (`/dashboard/configuracoes/listas`) | Adicionar `administrativo.listas` as permissoes |

## Alteracoes

### `src/lib/pagePermissions.ts`

1. **Remover** `gestao_vendas.analises` dos filhos de "Gestao de Vendas" (linha 22)
2. **Remover** `gestao_clientes.processos` dos filhos de "Gestao de Clientes" (linha 33)
3. **Adicionar** `administrativo.listas` com label "Listas do Sistema" aos filhos de "Administrativo" (entre "Automacoes" e "Guia de Uso")
4. **Remover** da `ROUTE_TO_PERMISSION`:
   - `/dashboard/vendas/analises` (linha 93)
   - `/dashboard/processos` (linha 97)
5. **Adicionar** a `ROUTE_TO_PERMISSION`:
   - `"/dashboard/configuracoes/listas": "administrativo.listas"`

### Resultado esperado

As permissoes no editor de usuarios passarao a refletir exatamente o menu lateral:

- Gestao de Vendas: Marketing, Leads
- Gestao de Clientes: Clientes, Documentos
- Gestao de Rotinas: Tarefas, Prazos
- Pesquisas: Visao Geral, Consultar Processo, CPF, CNPJ, Historico
- Financeiro: Analises, Pagamentos
- Relatorios: Vendas, Financeiro
- Administrativo: Meu Perfil, Usuarios, Modelos Chat, Automacoes, **Listas do Sistema**, Guia de Uso
