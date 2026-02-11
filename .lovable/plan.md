
# Plano: Modelos por Tipo de Acao + Duplicacao + Biblioteca Organizada

## Resumo

Reorganizar a tela de Modelos para funcionar como uma biblioteca organizada por categoria/tipo de acao, com filtro por categoria, funcionalidade de duplicar modelos existentes (tanto padrao quanto personalizados) como base para novos, e integracao dos modelos personalizados nos seletores de contrato e proposta.

## Situacao Atual

- Modelos padrao sao hardcoded em `contratoTemplates.ts` (3 modelos: divorcio, indenizacao, adendo)
- Modelos personalizados sao salvos na tabela `templates` via upload com IA
- `GerarContratoForm` so lista modelos padrao no seletor (nao inclui personalizados)
- `GerarPropostaForm` ja combina modelos padrao + personalizados
- `TIPOS_CONTRATO` tem categorias limitadas (proposta, divorcio, indenizacao, curatela, inventario, trabalhista, previdenciario, outro)
- Nao existe funcao de duplicar modelo

## Alteracoes

### 1. Expandir categorias em `TIPOS_CONTRATO` (`src/types/contratos.ts`)

Adicionar tipos de acao mais especificos:
- `execucao_alimentos` - Execucao de Alimentos
- `revisional_alimentos` - Revisional de Alimentos
- `guarda` - Guarda/Regulamentacao
- `saude` - Acao de Saude
- `consumidor` - Direito do Consumidor
- `obrigacao_fazer` - Obrigacao de Fazer

### 2. Filtro por categoria na biblioteca de modelos (`ModelosContrato.tsx`)

- Adicionar filtro horizontal (chips/tabs) no topo: "Todos", e depois cada categoria
- Filtrar tanto modelos personalizados quanto padrao pela categoria selecionada
- Contar quantos modelos existem por categoria
- Manter layout de grid existente

### 3. Botao "Duplicar" nos modelos (`ModelosContrato.tsx`)

**Modelos personalizados:**
- Adicionar botao "Duplicar" (icone Copy) ao lado de Editar e Excluir
- Ao clicar, cria copia do modelo no banco com nome "{nome} (copia)" via novo hook

**Modelos padrao:**
- Adicionar botao "Usar como Base" que cria um modelo personalizado a partir do padrao
- Salva no banco como modelo editavel com o conteudo do template padrao

### 4. Hook `useDuplicarModelo` em `useModelosDocumentos.ts`

Nova mutation que:
- Recebe o modelo original (personalizado ou dados do padrao)
- Insere novo registro na tabela `templates` com nome "(copia)" e mesmo conteudo
- Invalida queries para atualizar listagem

### 5. Incluir modelos personalizados no seletor de contratos (`GerarContratoForm.tsx`)

- Combinar `MODELOS_CONTRATO` (padrao) com modelos personalizados do banco (tipo = 'contrato')
- Usar `useModelosPersonalizados('contrato')` ja existente
- No seletor, agrupar: primeiro personalizados, depois padrao
- Ao selecionar modelo personalizado, usar o `servico_padrao` do JSON como template

### 6. Auto-selecao de modelo por tipo de processo

Quando o usuario seleciona um cliente no `GerarContratoForm`:
- Verificar o `tipo_processo` do cliente
- Buscar modelo personalizado que tenha categoria compativel
- Se encontrar, pre-selecionar o modelo automaticamente

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/types/contratos.ts` | Expandir `TIPOS_CONTRATO` com novos tipos de acao |
| `src/components/documentos/ModelosContrato.tsx` | Filtro por categoria + botao Duplicar + botao Usar como Base |
| `src/hooks/useModelosDocumentos.ts` | Novo hook `useDuplicarModelo` |
| `src/components/documentos/GerarContratoForm.tsx` | Incluir modelos personalizados no seletor |

## Detalhes Tecnicos

**Filtro por categoria:**
```text
Estado local: categoriaFiltro (string | 'todos')
Filtragem: modelosPersonalizados.filter(m => categoriaFiltro === 'todos' || m.categoria === categoriaFiltro)
Mesmo para modelos padrao: MODELOS_CONTRATO.filter(m => categoriaFiltro === 'todos' || m.tipo === categoriaFiltro)
```

**Duplicacao de modelo personalizado:**
```text
INSERT INTO templates (nome, tipo, categoria, conteudo, descricao, ativo, variaveis)
VALUES ('{nome} (cópia)', tipo, categoria, conteudo, descricao, true, variaveis)
```

**Duplicacao de modelo padrao (Usar como Base):**
```text
Montar ModeloConteudo com servico_padrao = modelo.template
INSERT INTO templates com tipo = 'contrato', categoria = modelo.tipo
```

**Integracao no GerarContratoForm:**
```text
const todosModelosContrato = useMemo(() => {
  const modelosDB = modelosPersonalizados.map(m => ({
    id: m.id, nome: m.nome, tipo: m.categoria, template: parsed.servico_padrao, isCustom: true
  }));
  return [...modelosDB, ...MODELOS_CONTRATO.map(m => ({ ...m, isCustom: false }))];
}, [modelosPersonalizados]);
```

## Resultado

- Biblioteca de modelos organizada por categoria com filtros visuais
- Novos tipos de acao especificos disponiveis
- Duplicar qualquer modelo como base para criar variacao
- Modelos padrao podem ser copiados para edicao
- Seletor de contratos inclui modelos personalizados
- Auto-selecao de modelo baseada no tipo de processo do cliente
