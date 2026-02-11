
# Corrigir Salvamento de Consultas em Pesquisas

## Problema

Nenhuma consulta esta sendo salva na tabela `consultas_realizadas` (zero registros). A causa e que os headers CORS das 5 edge functions de consultas estao incompletos -- faltam os headers que o cliente Supabase v2.76.1 envia automaticamente. Isso faz o navegador bloquear a requisicao no preflight (OPTIONS).

## Solucao

Atualizar o `corsHeaders` em 5 edge functions para incluir os headers adicionais do Supabase client.

### Arquivos a alterar

Todos com a mesma alteracao no objeto `corsHeaders`:

1. **`supabase/functions/consultas-datajud/index.ts`** (linha 5-6)
2. **`supabase/functions/consultas-brasilapi/index.ts`** (linha 5-6)
3. **`supabase/functions/consultas-cpf/index.ts`** (linha 5-6)
4. **`supabase/functions/consultas-imovel/index.ts`** (linha 5-6)
5. **`supabase/functions/consultas-veiculo/index.ts`** (linha 5-6)

### Alteracao (identica em todos)

De:
```text
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
```

Para:
```text
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

### Resultado

Apos a correcao, as chamadas do navegador passarao pelo preflight CORS e as edge functions executarao normalmente, salvando cada consulta na tabela `consultas_realizadas` com todos os dados (tipo, parametro, resultado, usuario, custo, status).
