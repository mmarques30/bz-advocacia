

## Continuação da varredura — itens pendentes

### O que já foi corrigido
- 22 arquivos de código morto deletados
- RLS de 13 tabelas corrigido (public → authenticated, roles restritivas)
- Bug `created_at: ""` corrigido no Dashboard
- `.limit(5000)` adicionado em queries de processos
- Tipo `DashboardFilters` movido para `analytics.ts`

### O que falta corrigir

**1. Rota duplicada whatsapp-templates** (item #20)
- Linha 199 do `App.tsx`: redirect `whatsapp-templates → modelos` captura antes da rota real na linha 259
- **Ação:** Remover o redirect da linha 199 (a rota real na linha 259 é a correta)

**2. Páginas sem rota — deletar arquivos órfãos** (item #7)
- `src/pages/pesquisas/Imoveis.tsx` — sem rota, sem import
- `src/pages/pesquisas/Veiculos.tsx` — sem rota, sem import
- `src/pages/pesquisas/Configuracao.tsx` — sem rota, sem import
- `src/pages/comunicacao/Index.tsx` — sem rota, sem import
- **Ação:** Deletar os 4 arquivos

**3. RLS `TO public` em `chat_messages`** (não mapeado inicialmente mas identificado agora)
- Policies de `chat_messages` usam `TO public` — deveria ser `TO authenticated`
- **Ação:** Migration para corrigir

**4. RLS `TO public` em `demandas_internas`** (identificado agora)
- 4 policies usam `TO public`
- **Ação:** Migration para corrigir para `TO authenticated`

**5. RLS `TO public` em `apify_config`**
- 3 policies usam `TO public`
- **Ação:** Migration para corrigir

**6. RLS `TO public` em `melhorias_registro`** (INSERT)
- Insert policy usa `TO public`
- **Ação:** Migration para corrigir

**7. Tabela `kpis` — possivelmente morta** (item #18)
- Sem INSERT/UPDATE/DELETE policies, sem trigger, sem função que popula
- **Ação:** Verificar uso no código; se não é referenciada, deletar tabela

### Arquivos editados
- `src/App.tsx` (remover redirect linha 199)
- 4 arquivos deletados (páginas órfãs)
- 1 migration SQL (RLS fixes para `chat_messages`, `demandas_internas`, `apify_config`, `melhorias_registro`)

