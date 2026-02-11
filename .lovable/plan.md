
# Plano: Separar Tratamento de Clientes e Leads no Dialog de Detalhes

## Problema

O dialog de detalhes (`LeadDetailsDialog`) e compartilhado entre Leads e Clientes, mas exibe metricas de pipeline de vendas (como "Parado ha X dias" e alerta vermelho) para clientes. Clientes devem ser acompanhados pelo status do processo, nao pelo tempo sem contato.

## Pontos afetados

| Local | Problema |
|-------|----------|
| Alerta vermelho "Lead parado ha X dias" (linha 73-79) | Aparece para clientes |
| Campo "Tempo Parado" na aba Informacoes (linha 139-146) | Aparece para clientes |
| Botao "Editar Lead" (linha 69) | Texto incorreto para clientes |
| `LeadCard.tsx` usado no Kanban de leads | Mostra "Parado ha X dias" -- ok para leads, mas precisa garantir que nao e usado no Kanban de clientes |

## Solucao

### Arquivo: `src/components/leads/LeadDetailsDialog.tsx`

1. Adicionar prop `isCliente?: boolean` ao componente
2. **Condicionar o alerta vermelho**: so exibir "Lead parado ha X dias" quando `isCliente` for `false`
3. **Condicionar o campo "Tempo Parado"**: so exibir na aba Informacoes quando `isCliente` for `false`
4. **Texto do botao**: trocar "Editar Lead" por "Editar Cliente" quando `isCliente` for `true`

### Arquivo: `src/pages/Clientes.tsx`

Passar `isCliente={true}` para o `LeadDetailsDialog` (ja passa para outros componentes como `NewLeadDialog`)

### Arquivo: `src/pages/Leads.tsx`

Nenhuma mudanca necessaria -- o comportamento padrao (`isCliente` ausente/false) mantem o alerta e campo de "dias parado" para leads.

## Resultado

- **Leads**: continuam mostrando alerta de tempo parado, campo de dias parado, botao "Editar Lead"
- **Clientes**: sem alerta de tempo, sem campo "Tempo Parado", botao "Editar Cliente", foco no status do cliente (Ativo/Inativo) que ja existe
