

## Substituir Dialog do cliente por Sheet lateral

### Alteração principal: `src/components/leads/LeadDetailsDialog.tsx`

Substituir `Dialog`/`DialogContent` por `Sheet`/`SheetContent` do shadcn/ui, mantendo toda a lógica e tabs intactas.

**Mudanças específicas:**

1. **Imports** — trocar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` por `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` de `@/components/ui/sheet`

2. **Componente raiz** — `<Dialog>` → `<Sheet>`, `<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">` → `<SheetContent side="right" className="w-full sm:w-[680px] sm:max-w-[680px] overflow-y-auto p-6">`

3. **Header** — `<DialogHeader>` → `<SheetHeader>`, `<DialogTitle>` → `<SheetTitle>`, `<DialogDescription>` → `<SheetDescription>`

4. **Cabeçalho enriquecido** (fora das tabs):
   - Nome em destaque (`SheetTitle`)
   - Badge de status (Ativo/Inativo) ao lado do nome
   - Linha com CPF mascarado · X processos · cidade (quando disponíveis)
   - O botão X de fechar já vem nativo do `SheetContent`

5. **Tabs** — sem alteração estrutural, apenas mais espaço horizontal disponível

6. **ProcessoDetailsInline** — permanece igual, substituindo o corpo do drawer quando selecionado

7. **Mobile** — `w-full` garante 100vw em telas pequenas; `sm:w-[680px]` aplica a largura fixa no desktop

### Arquivos que chamam o componente (sem alteração necessária)
- `src/pages/Clientes.tsx` — usa `LeadDetailsDialog` com `isCliente={true}`, props idênticas
- `src/pages/Leads.tsx` — usa `LeadDetailsDialog`, props idênticas

A interface `LeadDetailsDialogProps` permanece a mesma (open, onClose, lead, onEdit, isCliente).

