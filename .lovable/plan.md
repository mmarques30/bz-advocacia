

# Remover Emojis e Padronizar Cores da Marca

## Problema

Foram encontrados **emojis em 5 arquivos** (violando a diretriz "apenas icones Lucide") e **cores despadronizadas em 3 paginas de KPIs** que usam cores arbitrarias (azul, roxo, ciano, laranja) em vez da paleta da marca (primary/bronze, secondary/cinza, muted, destructive).

## 1. Remocao de Emojis (5 arquivos)

### `src/components/usuarios/DeleteUserDialog.tsx`
- Remover `⚠️` do texto de aviso, substituir pelo icone `AlertTriangle` do Lucide (ja importado ou a importar)

### `src/components/processos/tabs/ProcessoComunicacaoTab.tsx`
- Remover `⚠️` do aviso "Cliente nao possui telefone", substituir por icone `AlertTriangle`

### `src/components/pesquisas/ConsultaCPFForm.tsx`
- Remover `⚠️` do registro de obito, substituir por icone `AlertTriangle`

### `src/components/leads/ImportClientesPlanilhaDialog.tsx`
- Remover `ℹ️` do "Formato esperado", substituir por icone `Info`
- Remover `⚠️` do aviso de processos
- Remover `📁` do badge de pasta, substituir por icone `FolderOpen`
- Remover `🟢 Ativo` e `⚪ Inativo`, usar apenas texto com cores de badge adequadas

### `src/components/financeiro/pagamentos/PagamentosAtrasados.tsx`
- Remover `🎉` do texto "Nenhuma despesa pendente", substituir por icone `CheckCircle`

## 2. Padronizar Cores de KPIs (3 arquivos)

Cores de icones de KPI devem seguir a paleta da marca em vez de cores arbitrarias do Tailwind.

### `src/components/financeiro/FaturamentoKPIs.tsx`
Substituicoes:
- `text-green-500` (Receita) → `text-primary` (bronze, cor da marca)
- `text-cyan-500` (Projecao) → `text-muted-foreground`
- `text-blue-500` (A Receber) → `text-secondary`
- `text-purple-500` (Ticket Medio) → `text-muted-foreground`
- `text-destructive` (Em Atraso) → manter (cor semantica de erro)

### `src/pages/comunicacao/Index.tsx`
Substituicoes:
- `text-blue-600` (Total) → `text-primary`
- `text-green-600` (Entregues) → `text-primary`
- `text-purple-600` (Lidas) → `text-secondary`
- `text-red-600` (Falhas) → `text-destructive`
- `text-yellow-600` (Pendentes) → `text-muted-foreground`

### `src/pages/configuracoes/index.tsx`
Substituicoes (icones dos cards de configuracao):
- `text-blue-600` (Usuarios) → `text-secondary`
- `text-emerald-600` (Modelos Chat) → `text-primary`
- `text-orange-600` (Automacoes) → `text-primary`
- `text-cyan-600` (Listas) → `text-secondary`
- `text-purple-600` (Guia) → `text-muted-foreground`
- `text-primary` (Perfil) → manter

## Nao alterar (cores semanticas aceitaveis)

As seguintes cores **nao serao alteradas** pois sao semanticas e funcionais:
- Verde/emerald para receitas e sucesso em tabelas financeiras
- Vermelho/destructive para despesas e erros
- Amber para alertas e avisos
- Cores categoricas em badges de origem de lead e estagios (diferenciam visualmente categorias distintas)
- Cores do calendario de prazos (urgencia visual)
- Cores de trend positivo/negativo em KPICard

## Resultado

- Zero emojis no sistema (apenas icones Lucide)
- KPIs e cards de navegacao usando paleta da marca (bronze, cinza, muted)
- Cores semanticas preservadas onde fazem sentido funcional
