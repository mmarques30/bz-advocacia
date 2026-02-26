

# Plano: Editar e excluir modelos padrão de contratos e propostas

## Problema atual
Os modelos padrão (hardcoded em `contratoTemplates.ts` e `propostaTemplates.ts`) só têm botões "Visualizar" e "Usar como Base". Não é possível editá-los nem excluí-los.

## Solução

### `ModelosContrato.tsx` — Adicionar botões Editar e Excluir nos cards padrão

**Editar modelo padrão:**
- Ao clicar "Editar", o sistema salva automaticamente o modelo padrão no banco como modelo personalizado (via `useDuplicarModelo`, sem sufixo "cópia")
- Abre o `EditModeloDialog` com o modelo recém-criado
- O modelo padrão original é ocultado (ID salvo em `localStorage`)

**Excluir modelo padrão:**
- Ao clicar "Excluir", mostra o `AlertDialog` de confirmação
- Salva o ID do modelo padrão em `localStorage` como oculto
- O modelo não aparece mais na listagem

**Lógica de ocultação:**
- `localStorage.getItem('hidden_default_models')` → array de IDs de modelos padrão ocultos
- Filtrar `padraoFiltrados` para excluir IDs ocultos
- Botão opcional "Restaurar modelos padrão" na interface

### Novo hook auxiliar: `useSalvarModeloPadraoComoDB`
- Mutation que salva modelo padrão no banco sem sufixo "(cópia)", retornando o modelo personalizado criado
- Após sucesso, oculta o modelo padrão original

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `ModelosContrato.tsx` | Adicionar Edit/Delete nos cards padrão + lógica de ocultação via localStorage |

