

## Corrigir lógica do funil: propostas para leads, contratos para clientes

### Situação atual

- `GerarPropostaForm` usa `useLeads()` que traz TODOS os leads (sem filtro por estágio)
- `GerarContratoForm` usa `useLeadsSimple()` que traz TODOS os contact_submissions
- Ambos permitem selecionar qualquer pessoa, independente do estágio
- A automação de status já existe e funciona (`atualizarLeadParaPropostaEnviada` e `atualizarLeadParaFechado`)
- No `LeadDetailsDialog`, a aba "Contratos" só aparece para clientes (`isCliente`)

### Alterações

**1. `src/components/documentos/GerarPropostaForm.tsx`** — Filtrar seletor para mostrar apenas leads (não-fechados)
- Após buscar leads, filtrar para exibir apenas aqueles com `estagio !== 'fechado'`
- Alterar label de "Cliente (Lead)" para "Lead"

**2. `src/components/documentos/GerarContratoForm.tsx`** — Filtrar seletor para mostrar apenas clientes (fechados)
- No `useLeadsSimple`, adicionar `.eq('estagio', 'fechado')` para buscar apenas clientes
- Manter label "Cliente"

**3. `src/components/leads/LeadDetailsDialog.tsx`** — Mostrar aba "Contratos/Propostas" para leads também
- Para leads (não-clientes), exibir a aba `LeadContratosTab` mas com label "Propostas" em vez de "Contratos"
- Isso permite que leads vejam propostas geradas para eles

**4. `src/components/documentos/ContratosHistorico.tsx`** — Sem alteração necessária
- Já mostra todos os documentos (propostas e contratos) com filtro por tipo funcional

### Arquivos editados
- `src/components/documentos/GerarPropostaForm.tsx` (filtrar leads não-fechados)
- `src/components/documentos/GerarContratoForm.tsx` (filtrar apenas clientes fechados)
- `src/components/leads/LeadDetailsDialog.tsx` (exibir aba propostas para leads)

