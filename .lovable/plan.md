

# Plano: Sempre mostrar seção de propostas no formulário de contrato

## Problema
A seção "Propostas do Cliente" no `GerarContratoForm.tsx` só aparece quando o cliente selecionado já tem propostas geradas (`propostasCliente.length > 0`). Quando não há propostas, a seção fica invisível e o usuário não percebe que essa funcionalidade existe.

## Solução

### `GerarContratoForm.tsx` — Sempre exibir a seção de propostas após selecionar cliente
- Remover a condição `propostasCliente.length > 0` do render
- Mostrar a seção sempre que um cliente estiver selecionado (`clienteId`)
- Quando houver propostas: exibir o dropdown normalmente
- Quando não houver propostas: exibir mensagem informativa "Nenhuma proposta gerada para este cliente"
- Mover a seção para uma posição mais visível (logo após o seletor de cliente, antes do painel de dados)

### Arquivos alterados
| Arquivo | Alteração |
|---|---|
| `GerarContratoForm.tsx` | Sempre mostrar seção de propostas ao selecionar cliente, com estado vazio quando não há propostas |

