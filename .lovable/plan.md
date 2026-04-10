

## Navegação inline: Cliente → Processo (sem dialogs sobrepostos)

### Alterações

**1. Criar `src/components/processos/ProcessoDetailsInline.tsx`**
- Componente sem wrapper Dialog, apenas conteúdo interno
- Props: `processoId: string`, `onBack: () => void`, `clienteNome: string`
- Mesma query de dados do `ProcessoDetailsDialog` (busca processo com cliente)
- Renderiza botão "← Voltar para {clienteNome}" no topo
- Título com número do processo + badge Extrajudicial
- Todas as 8 tabs: Informações, Andamentos, Tarefas, Prazos, Documentos, Comunicação, Financeiro, Histórico
- Reutiliza os mesmos componentes de tab existentes

**2. Alterar `src/components/leads/ClienteProcessosTab.tsx`**
- Adicionar prop `onSelectProcesso?: (id: string) => void`
- Remover import e uso de `ProcessoDetailsDialog`
- Remover estado `selectedProcessoId`
- Ao clicar em processo: chamar `onSelectProcesso(id)` se existir, senão comportamento atual
- Manter `NewProcessoDialog` intacto

**3. Alterar `src/components/leads/LeadDetailsDialog.tsx`**
- Adicionar estado `selectedProcessoId: string | null`
- Resetar `selectedProcessoId` para null quando dialog fecha
- Quando `selectedProcessoId === null`: layout normal com abas do cliente
- Quando `selectedProcessoId !== null`: substituir conteúdo por `ProcessoDetailsInline`
- Passar `onSelectProcesso` para `ClienteProcessosTab`

**4. `ProcessoDetailsDialog` — sem alteração**
- Continua existindo para uso na página de Processos

### Arquivos
- `src/components/processos/ProcessoDetailsInline.tsx` (novo)
- `src/components/leads/ClienteProcessosTab.tsx` (callback em vez de dialog)
- `src/components/leads/LeadDetailsDialog.tsx` (estado inline + renderização condicional)

