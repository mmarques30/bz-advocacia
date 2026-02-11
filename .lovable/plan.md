
# Plano: Lead vira Cliente ao Emitir Contrato

## Resumo

Separar a logica de automacao em duas funcoes distintas: propostas movem o lead para `proposta_enviada`, contratos movem para `fechado` (cliente). O unico status que permanece manual e `perdido`.

## Alteracoes

### 1. `src/lib/leadStatusAutomation.ts` - Nova funcao para contratos

Adicionar funcao `atualizarLeadParaFechado` que:
- Aceita qualquer estagio exceto `perdido` (ou seja, `novo`, `contato_inicial`, `em_analise`, `proposta_enviada`)
- Atualiza `estagio` para `fechado`
- Atualiza `status_cliente` para `ativo` (tornando-o cliente)
- Registra atividade: "Contrato emitido - lead convertido em cliente"
- Invalida queries de leads

Ajustar a funcao `atualizarLeadParaPropostaEnviada` existente para ser usada apenas por propostas (sem mudanca, ja funciona assim).

### 2. `src/components/documentos/GerarContratoForm.tsx` - Usar nova funcao

Substituir a chamada `atualizarLeadParaPropostaEnviada(clienteId, 'contrato', queryClient)` pela nova `atualizarLeadParaFechado(clienteId, queryClient)`.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/lib/leadStatusAutomation.ts` | Adicionar `atualizarLeadParaFechado` |
| `src/components/documentos/GerarContratoForm.tsx` | Trocar chamada para nova funcao |

## Detalhes Tecnicos

Nova funcao em `leadStatusAutomation.ts`:

```text
1. Buscar estagio atual do lead
2. Se estagio != 'perdido' e != 'fechado':
   - UPDATE contact_submissions SET estagio = 'fechado', status_cliente = 'ativo', data_ultima_atividade = now()
   - INSERT INTO atividades (tipo = 'lead_convertido', descricao = 'Contrato emitido - lead convertido em cliente')
3. Invalidar queries ['leads'], ['leads-simple'], ['lead-activities']
```

## Resultado

- Proposta gerada: lead vai para "Proposta Enviada" (ja funciona)
- Contrato emitido: lead vai para "Fechado" e se torna cliente ativo automaticamente
- Unico status manual: "Perdido"
