

## Suporte a processos extrajudiciais

### Alterações no banco
Adicionar duas colunas à tabela `processos`:
```sql
ALTER TABLE public.processos 
  ADD COLUMN extrajudicial boolean DEFAULT false,
  ADD COLUMN codigo_interno text;
```

### Alterações no código

**1. `src/types/processos.ts`** — Adicionar `extrajudicial` e `codigo_interno` à interface `Processo`

**2. `src/hooks/useProcessos.ts`** — Na busca (filtro `search`), incluir `codigo_interno` no `.or()` junto com `numero_processo`

**3. `src/components/processos/NewProcessoDialog.tsx`**
- Adicionar checkbox "Processo extrajudicial" no topo do formulário
- Quando marcado: ocultar campo `numero_processo`, campos tribunal/comarca/vara; exibir campo `Código interno` (read-only, gerado automaticamente)
- Gerar código `EXT-[ANO]-[SEQ]` buscando o último código do ano no banco antes de inserir
- Ao submeter, enviar `extrajudicial: true` e `codigo_interno` gerado

**4. `src/components/processos/ProcessosTable.tsx`**
- Na coluna "Nº Processo": exibir `codigo_interno` + badge "Extrajudicial" quando `extrajudicial === true`, caso contrário exibir `numero_processo`

**5. `src/components/processos/ProcessoDetailsDialog.tsx`**
- No título: usar `codigo_interno` quando extrajudicial, com badge

**6. `src/components/processos/tabs/ProcessoInformacoesTab.tsx`**
- No modo edição: exibir checkbox extrajudicial e campos condicionais (código interno read-only vs número do processo)
- Auditar alteração do campo `extrajudicial`

**7. `src/components/processos/ProcessosHeader.tsx`**
- O placeholder de busca já menciona "número ou cliente", sem mudanças necessárias (a busca por `codigo_interno` é resolvida no hook)

### Arquivos editados
- Migration: 2 colunas novas
- `src/types/processos.ts`
- `src/hooks/useProcessos.ts`
- `src/components/processos/NewProcessoDialog.tsx`
- `src/components/processos/ProcessosTable.tsx`
- `src/components/processos/ProcessoDetailsDialog.tsx`
- `src/components/processos/tabs/ProcessoInformacoesTab.tsx`

