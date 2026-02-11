
# Plano: Edicao de Modelos de Documentos

## Resumo

Adicionar botao "Editar" em cada modelo personalizado (propostas e contratos) na tela de Modelos, abrindo um dialog com editor de texto completo que permite alterar nome, categoria, descricao, conteudo e variaveis do modelo. Inclui versionamento basico salvando o historico de alteracoes.

## Contexto Atual

- Modelos personalizados sao salvos na tabela `templates` com conteudo em JSON (`ModeloConteudo`)
- Ja existe `useUpdateTemplate` no hook `useTemplates.ts` pronto para usar
- Ja existe `TemplateEditor` com insercao de variaveis dinamicas
- Modelos padrao (hardcoded em `contratoTemplates.ts`) NAO serao editaveis -- apenas os personalizados criados via IA

## Alteracoes

### 1. Nova tabela: `templates_versoes` (migracao)

Para manter historico de alteracoes:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| template_id | uuid | FK para templates |
| versao | integer | Numero da versao (incrementa) |
| nome | text | Nome na versao |
| conteudo | text | Conteudo na versao |
| descricao | text | Descricao na versao |
| variaveis | text[] | Variaveis na versao |
| editado_por | uuid | Usuario que editou |
| created_at | timestamptz | Data da versao |

RLS: usuarios autenticados podem ler e inserir.

### 2. Novo componente: `EditModeloDialog.tsx` em `src/components/documentos/`

Dialog de edicao com:
- Campo **Nome** do modelo (editavel)
- Select de **Categoria** (saude, familia, civel, etc.)
- Campo **Descricao** (editavel)
- **Editor de conteudo** usando `TemplateEditor` existente para inserir variaveis
- Exibicao das **variaveis detectadas** automaticamente no conteudo
- Secao de **Historico de Versoes** colapsavel mostrando versoes anteriores
- Botoes: Cancelar, Salvar

Ao salvar:
1. Salva versao atual na tabela `templates_versoes` (antes de sobrescrever)
2. Atualiza o template na tabela `templates` via `useUpdateTemplate`
3. Invalida queries para atualizar a listagem

### 3. Hook: `useUpdateModelo` em `useModelosDocumentos.ts`

Nova mutation que:
- Recebe id do modelo e dados atualizados
- Busca dados atuais do template (para salvar como versao anterior)
- Insere versao anterior em `templates_versoes`
- Atualiza template com novos dados
- Invalida queries

### 4. Hook: `useModeloVersoes` em `useModelosDocumentos.ts`

Query simples que busca versoes anteriores de um template:
- Filtra por `template_id`
- Ordena por `versao` descendente

### 5. Componente: `ModelosContrato.tsx` - Adicionar botao Editar

Nos cards de modelos personalizados:
- Adicionar botao "Editar" ao lado do card (icone Pencil)
- Ao clicar, abre `EditModeloDialog` com dados do modelo
- Adicionar tambem botao "Excluir" (desativa o modelo via `useDeleteTemplate` existente)

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | **Nova** - tabela `templates_versoes` |
| `src/components/documentos/EditModeloDialog.tsx` | **Novo** - dialog de edicao |
| `src/hooks/useModelosDocumentos.ts` | Adicionar `useUpdateModelo` e `useModeloVersoes` |
| `src/components/documentos/ModelosContrato.tsx` | Adicionar botoes Editar/Excluir nos cards personalizados |

## Resultado

- Cada modelo personalizado tera botao "Editar" no card
- Editor completo com insercao de variaveis dinamicas
- Historico de versoes anteriores acessivel dentro do dialog
- Variaveis sao preservadas e detectadas automaticamente
- Modelos padrao permanecem inalterados (somente visualizacao)
