## Default da Gestão de Vendas: Kanban

Mudança simples de uma linha em `src/pages/Leads.tsx`:

```ts
const [view, setView] = useState<'table' | 'kanban'>('kanban');
```

Vale para qualquer aba (leads orgânicos e anúncios) — o `view` é compartilhado. O usuário ainda pode alternar para tabela pelo toggle no header; só muda o estado inicial.

Sem alterações em outros arquivos.
