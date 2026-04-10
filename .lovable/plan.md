

## Padronizar tipografia dos títulos h1 de página com font-seasons

### Padrão de referência (Dashboard)
```html
<h1 className="text-3xl md:text-4xl font-seasons text-primary">
```
Sem `font-bold`, usando `font-seasons` + `text-primary`.

### Regra
Todos os `<h1>` de nível de página passam de `text-Xnl font-bold ...` para `text-3xl font-seasons text-primary`. Subtítulos de cards e seções (`<h2>`, `<h3>`) permanecem com `font-bold`.

### Arquivos a alterar (cerca de 30 páginas)

| Arquivo | De | Para |
|---|---|---|
| `src/pages/Leads.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/Clientes.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/Processos.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/Financeiro.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/Documentos.tsx` | `text-2xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/processos/Demandas.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/processos/Calendario.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/pesquisas/Index.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/pesquisas/CPF.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/pesquisas/CNPJ.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/pesquisas/Historico.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/pesquisas/Processos.tsx` | `text-2xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/financeiro/Acordos.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/financeiro/Historico.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/financeiro/Pagamentos.tsx` | `text-2xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/financeiro/Relatorios.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/vendas/MetaAds.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/vendas/Analises.tsx` | `text-2xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/vendas/RelatoriosVendas.tsx` | `text-3xl font-bold tracking-tight` | `text-3xl font-seasons text-primary` |
| `src/pages/comunicacao/Templates.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Geral.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Usuarios.tsx` | `text-3xl font-bold` (2 ocorrências) | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Tags.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Controle.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Modelos.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/GuiaDeUso.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Automacoes.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/ListasSuspensas.tsx` | `text-3xl font-bold` | `text-3xl font-seasons text-primary` |
| `src/pages/configuracoes/Perfil.tsx` | verificar e atualizar |
| `src/pages/configuracoes/Cadastros.tsx` | verificar e atualizar |
| `src/pages/configuracoes/Logs.tsx` | verificar e atualizar |
| `src/pages/configuracoes/Atualizacoes.tsx` | verificar e atualizar |

### Exceções (NÃO alterar)
- `src/pages/Index.tsx` e `src/pages/Success.tsx` — páginas públicas, estilo próprio
- `src/pages/Auth.tsx` — já usa `font-seasons`, manter como está
- `src/pages/Dashboard.tsx` — já é o padrão de referência

### O que NÃO muda
- Títulos `<h2>` de cards e seções (ex: `DespesasHeader`, `KPICard`) continuam com `font-bold`
- Nenhuma estrutura, aba ou navegação é alterada

