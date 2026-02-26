

# Plano: Modelos editáveis de contratos e propostas na aba Modelos

## Problema atual
- `ModelosContrato.tsx` só busca modelos personalizados do tipo `'contrato'` via `useModelosPersonalizados('contrato')`
- Os modelos padrão de proposta (`MODELOS_PROPOSTA`) não aparecem na aba Modelos
- Não há como criar/editar modelos de proposta nessa aba

## Alterações

### 1. `src/components/documentos/ModelosContrato.tsx`
- Buscar também `useModelosPersonalizados('proposta')` e combinar ambos os resultados
- Incluir `MODELOS_PROPOSTA` ao lado de `MODELOS_CONTRATO` nos modelos padrão
- Adicionar filtro de tipo (Contrato / Proposta) nos chips de categoria
- No `UploadModeloDialog`, permitir selecionar se é contrato ou proposta
- No `handleUsarComoBase`, mapear corretamente propostas padrão (tipo `'proposta'`)

### 2. `src/components/documentos/UploadModeloDialog.tsx`
- Adicionar campo de seleção de tipo do modelo (contrato vs proposta) para que o usuário possa criar modelos de proposta com IA

### 3. `src/lib/propostaTemplates.ts`
- Adicionar campo `template` aos modelos de proposta padrão com o texto completo do modelo, similar ao que já existe em `contratoTemplates.ts`, para que possam ser visualizados e usados como base

### Detalhes técnicos
- `useModelosPersonalizados` já aceita `'proposta'` como parâmetro, sem necessidade de alteração no hook
- `EditModeloDialog` já funciona para ambos os tipos (usa a mesma estrutura `ModeloPersonalizado`)
- `TIPOS_CONTRATO` já inclui `{ value: 'proposta', label: 'Proposta' }`, então os filtros de categoria já contemplam propostas

