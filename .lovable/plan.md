

# Padronizar tamanho dos botões de ação no sistema

## Problema
Botões de ação (Novo Lead, Nova Despesa, Importar, etc.) usam tamanhos inconsistentes: alguns sem `size` (h-10, o maior), outros com `size="sm"` (h-9). Alguns usam `size="lg"` (h-11) em formulários.

## Padrão a aplicar
- **Botões de ação em headers/toolbars**: `size="sm"` (h-9) — compacto e discreto
- **Botões icon-only em tabelas**: mantêm `size="icon"` com `h-8 w-8` (já estão ok)
- **Botões em formulários/dialogs (submit/cancel)**: `size="sm"` — não precisam ser `lg`
- **Botões na Auth page**: mantêm `size="lg"` (exceção, tela de login deve ser destaque)

## Arquivos e alterações

### 1. `src/components/leads/LeadsHeader.tsx`
- Linha 98: `<Button onClick={onNewLead}>` → `<Button size="sm" onClick={onNewLead}>`
- Linha 105: `<Button variant="outline">` (Importar) → `<Button variant="outline" size="sm">`
- Linha 194: `<Button variant="outline"` (Filtros) → adicionar `size="sm"`

### 2. `src/components/processos/ProcessosHeader.tsx`
- Linha 41: `<Button onClick={onNewProcesso}` → adicionar `size="sm"`
- Linha 75: `<Button variant="outline"` (Filtros) → adicionar `size="sm"`
- Linha 85: `<Button variant="outline"` (Ver Prazos) → adicionar `size="sm"`

### 3. `src/components/demandas/DemandasHeader.tsx`
- Linha 17: `<Button onClick={onNewDemanda}>` → `<Button size="sm" onClick={onNewDemanda}>`

### 4. `src/components/financeiro/despesas/DespesasHeader.tsx`
- Linha 22: `<Button onClick={onNewDespesa}>` → `<Button size="sm" onClick={onNewDespesa}>`

### 5. `src/components/financeiro/AcordosHeader.tsx`
- Linha 35: `<Button onClick={onNewAcordo}>` → `<Button size="sm" onClick={onNewAcordo}>`

### 6. `src/pages/Financeiro.tsx`
- Linha 154: `<Button variant="outline"` (Importar faturamento) → adicionar `size="sm"`
- Linha 158: `<Button onClick=` (Nova Entrada) → adicionar `size="sm"`
- Linha 199: `<Button variant="outline"` (Importar despesas) → adicionar `size="sm"`
- Linha 203: `<Button onClick=` (Nova Despesa) → adicionar `size="sm"`

### 7. `src/components/documentos/UploadModeloDialog.tsx`
- Linha 279: `size="lg"` → remover (usar default)

### 8. `src/components/documentos/GerarPropostaForm.tsx`
- Linha 289: `size="lg"` → remover (usar default)

Todas as alterações são cosméticas. Nenhuma lógica muda.

