

## Corrigir RLS das tabelas financeiras

### Problema
Várias tabelas financeiras têm policies usando `TO public` (acessível sem login) em vez de `TO authenticated`. Além disso, faltam restrições por role — qualquer usuário autenticado pode ler/escrever dados financeiros.

### Tabelas afetadas e estado atual

| Tabela | Problema |
|--------|----------|
| `financeiro` | SELECT/INSERT ok (`authenticated`), mas faltam UPDATE e DELETE |
| `transacoes_financeiras` | ALL e SELECT usam `public` |
| `despesas_fixas` | ALL usa `public` |
| `creditos_condicionais` | ALL usa `public` |
| `parcelas_financeiras` | ALL usa `authenticated` sem restrição de role |

### Solução

Uma única migração SQL que:

1. **Remove** todas as policies existentes das 5 tabelas
2. **Cria** policies padronizadas para cada tabela:
   - **SELECT** → `TO authenticated` com `has_role(admin) OR has_role(advogado) OR has_role(financeiro)`
   - **INSERT** → `TO authenticated` com `has_role(admin) OR has_role(financeiro)`
   - **UPDATE** → `TO authenticated` com `has_role(admin) OR has_role(financeiro)`
   - **DELETE** → `TO authenticated` com `has_role(admin) OR has_role(financeiro)`

### Detalhes técnicos

A migração segue o padrão `DROP POLICY IF EXISTS` + `CREATE POLICY` para cada tabela. A função `has_role()` já existe como `SECURITY DEFINER`, evitando recursão em RLS.

Roles com acesso de **leitura**: `admin`, `advogado`, `financeiro`
Roles com acesso de **escrita**: `admin`, `financeiro`

A role `assistente` **não** terá acesso às tabelas financeiras.

### Impacto
- Usuários não autenticados perdem todo acesso a dados financeiros
- Usuários com role `user` ou `assistente` perdem acesso a dados financeiros
- Nenhuma alteração de código necessária — os hooks já usam o client autenticado

### Arquivo alterado
- Nova migração SQL (via migration tool)

