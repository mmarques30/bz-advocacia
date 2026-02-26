

# Plano: Adicionar saudação de boas-vindas no Dashboard

## Alteração em `src/pages/Dashboard.tsx`

1. Importar `useAuth` de `@/hooks/useAuth`
2. Extrair o nome do usuário via `user?.user_metadata?.full_name` ou fallback para o email
3. Adicionar acima do `UserPendenciasCards` um bloco com:
   - Saudação dinâmica por horário: "Bom dia", "Boa tarde", "Boa noite"
   - Nome do usuário em `text-foreground font-seasons` (fonte serifada da marca)
   - Subtítulo discreto em `text-muted-foreground text-sm`: "Aqui está o resumo do seu escritório"
   - Sem card/borda — apenas texto limpo com espaçamento mínimo

### Layout visual
```text
Boa tarde, Dra. Maria                    ← font-seasons text-xl text-foreground
Aqui está o resumo do seu escritório     ← text-sm text-muted-foreground
```

Cores: foreground (escuro da marca) para o nome, muted-foreground (cinza) para o subtítulo. Sem emojis, sem ícones — clean e discreto conforme solicitado.

