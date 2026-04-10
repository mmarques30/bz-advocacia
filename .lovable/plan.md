

## Sidebar mini mode com ícones visíveis

### Alterações

**1. `src/components/AppSidebar.tsx`**

- Trocar `collapsible="offcanvas"` para `collapsible="icon"`
- Para itens com submenu no modo colapsado: ao clicar no ícone, chamar `toggleSidebar()` para expandir o sidebar e abrir o grupo correspondente
- Remover condicionais `{!isCollapsed && ...}` desnecessárias para labels (o componente `Sidebar` com `collapsible="icon"` já esconde automaticamente via CSS overflow)
- Manter tooltips existentes nos `SidebarMenuButton` (prop `tooltip` já funciona no modo icon)
- Logo: no modo mini mostrar apenas o ícone `img`, esconder o texto "B&Z / Advocacia" (já funciona com `{!isCollapsed && ...}`)
- Footer: botão "Sair" já adapta com `size={isCollapsed ? "icon" : "default"}` — manter

**2. Lógica de clique no ícone com submenu (modo mini)**

Quando `isCollapsed` e o usuário clica num item com submenu:
- Chamar `toggleSidebar()` do `useSidebar()` para expandir
- Adicionar o grupo ao `openMenus` para que abra expandido

```typescript
const handleCollapsedClick = (title: string) => {
  toggleSidebar();
  if (!openMenus.includes(title)) {
    setOpenMenus(prev => [...prev, title]);
  }
};
```

No `CollapsibleTrigger`, quando colapsado, usar `onClick` com `handleCollapsedClick` em vez do toggle normal do Collapsible.

**3. Nenhuma alteração em `DashboardLayout.tsx` ou `sidebar.tsx`**

O componente `Sidebar` com `collapsible="icon"` já lida com a largura mini (~3rem) e o `SidebarInset` já se adapta automaticamente.

### Resultado
- Desktop: sidebar encolhe para faixa com ícones + tooltips, clique em ícone com submenu expande o sidebar
- Mobile: comportamento sheet/offcanvas mantido (gerenciado internamente pelo componente Sidebar)

