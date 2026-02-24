
# Corrigir Erro ao Mudar Leads de Etapa (Kanban)

## Problema Identificado

No Kanban de leads, ao arrastar um card para outra coluna, o sistema tenta usar o `over.id` do evento de drag-and-drop como o novo estagio. Porem, o `@dnd-kit/sortable` pode retornar o **ID de outro card** (um UUID) ao inves do ID da coluna (o nome do estagio).

Quando isso acontece, o sistema tenta gravar um UUID como valor de `estagio` no banco de dados, o que viola a constraint:

```text
CHECK (estagio IN ('novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'fechado', 'perdido'))
```

Resultado: erro 400 do banco.

## Solucao

### Arquivo: `src/components/leads/LeadsKanban.tsx`

Alterar o `handleDragEnd` para:

1. Quando `over.id` for um UUID de lead (nao um nome de estagio valido), descobrir em qual coluna esse lead de destino esta, e usar o estagio dessa coluna
2. Adicionar uma lista de estagios validos para validar antes de enviar a mutacao
3. Usar `useDroppable` nas colunas para garantir que elas sejam alvos de drop identificaveis

Concretamente:

- Adicionar `useDroppable` em cada coluna com `id` igual ao estagio (ex: `"novo"`, `"contato_inicial"`)
- No `handleDragEnd`, verificar se `over.id` e um estagio valido. Se nao for, buscar o lead alvo na lista e usar seu estagio como destino
- Manter protecao contra atualizar para o mesmo estagio

### Detalhes Tecnicos

```text
handleDragEnd(event):
  leadId = active.id
  overId = over.id

  SE overId esta em ESTAGIOS_VALIDOS:
    novoEstagio = overId
  SENAO:
    leadAlvo = leads.find(l => l.id === overId)
    SE leadAlvo:
      novoEstagio = leadAlvo.estagio
      SE novoEstagio === 'perdido': novoEstagio = 'fechado'  // agrupados
    SENAO:
      return  // nao encontrou destino valido

  SE lead.estagio === novoEstagio: return
  updateStage.mutate({ id: leadId, estagio: novoEstagio })
```

Tambem sera necessario envolver cada coluna em um componente droppable para que o dnd-kit reconheca as colunas como alvos de drop, nao apenas os cards.

Apenas o arquivo `src/components/leads/LeadsKanban.tsx` precisa ser alterado.
