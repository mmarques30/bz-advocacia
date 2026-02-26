

# Mover botão "Limpar Dados" para junto dos filtros (somente admins)

## Alterações em `src/pages/Financeiro.tsx`

1. **Importar `useCheckIsAdmin`** de `@/hooks/useUsuarios`
2. **Chamar o hook** no componente: `const { data: isAdmin } = useCheckIsAdmin();`
3. **Remover o botão "Limpar Dados" do header** (linhas 83-90) — o header fica apenas com título e descrição
4. **Mover o botão para dentro da aba "Visão Geral"**, ao lado do `TransacoesFilters`, como um botão discreto (`variant="ghost"`, `size="sm"`, `h-9 text-xs`)
5. **Renderizar condicionalmente**: só mostrar se `isAdmin === true`
6. **Manter o AlertDialog** existente sem alterações

### Layout na aba Visão Geral (resultado)
```text
[TransacoesFilters ...filtros...] [🗑 Limpar Dados]  ← só aparece para admins
[KPIs]
[Charts]
[Table]
```

O botão terá estilo `ghost` com texto `text-xs text-muted-foreground` e ícone pequeno, mantendo-o discreto e alinhado com os filtros.

