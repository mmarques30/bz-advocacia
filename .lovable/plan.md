

## Problema

A aba de Automações tem lógica de status incorreta para várias integrações:

1. **Google Sheets (Pendente)**: O status verifica `contact_submissions` com `origem = 'google-sheets'` ou `'planilha'`, mas os leads recebidos via Google Sheets são gravados com a origem real da plataforma (instagram, facebook, etc.). O campo que identifica a origem Google Sheets é o `ingestion_channel` na tabela `lead_acquisition_events`, ou a tabela `sheet_leads_raw` (que tem 127 registros). Por isso aparece "pendente" quando deveria ser "ativo".

2. **Datajud (Pendente)**: Mostra "pendente" por ter 0 consultas, mas a API key está configurada e a edge function existe. Se nunca foi usado, deveria mostrar "ativo" (configurado e pronto) em vez de "pendente".

3. **API de Consultas (Pendente)**: A tabela `consultas_config` tem `ativo: true` mas `api_token: null`. Status deveria refletir isso como "pendente" (sem token) -- este está correto.

4. **Meta Ads e WhatsApp**: Sem registros no banco. Status "inativo" -- correto.

## Solução

Corrigir a lógica de status em `src/hooks/useAutomacoes.ts`:

### Google Sheets
- Consultar `sheet_leads_raw` em vez de filtrar `contact_submissions` por origem
- Se `sheet_leads_raw` tem registros -> "ativo"
- Se tem 0 registros -> "pendente" (edge function existe, mas sem dados ainda)
- Mostrar contagem real de `sheet_leads_raw` como totalConsultas

### Datajud
- Verificar se a edge function existe (hardcoded, sabemos que sim) e se a API key está configurada
- Se configurado e já fez consultas -> "ativo"
- Se configurado mas sem consultas -> "ativo" (pronto para uso)
- Manter contagem de consultas realizadas nos detalhes

### Arquivo alterado
- `src/hooks/useAutomacoes.ts` -- corrigir queries e lógica de status

### Mudanças específicas

```typescript
// Trocar query de sheets leads:
// DE:
const sheetsLeads = leadsData.filter(l => l.origem === 'google-sheets' || l.origem === 'planilha');

// PARA: usar sheet_leads_raw diretamente
const sheetLeadsRaw = await supabase.from("sheet_leads_raw").select("id, created_at", { count: "exact" }).limit(1);
const sheetsTotal = sheetLeadsRaw.count || 0;
const sheetsUltima = sheetLeadsRaw.data?.[0]?.created_at || null;

// Google Sheets status:
status: sheetsTotal > 0 ? "ativo" : "pendente",
totalConsultas: sheetsTotal,

// Datajud status (API key existe):
status: "ativo", // edge function + secret configurados
```

