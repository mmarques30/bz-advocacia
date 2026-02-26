

# Plano: Remover busca (lupinha) em Leads Anúncios

## Alteração em `src/pages/Leads.tsx`

1. **Remover o estado `search`** (linha 256): `const [search, setSearch] = useState("");`
2. **Remover o bloco do input de busca** (linhas 320-328): o `div` com o ícone `Search` e o `Input` de busca
3. **Remover a lógica de filtro por `search`** no `useMemo` de `filteredLeads` (linhas 290-292): remover as linhas que filtram por `search.trim()` e comparação com `q`
4. **Remover `search` da lista de dependências** do `useMemo` (linha 309)

Resultado: os filtros de nome, origem e ordenação permanecem, apenas o campo de busca com lupinha é removido.

