

## Auto-expandir grupo do sidebar pela rota atual

### Alteração única em `src/components/AppSidebar.tsx`

- Importar `useLocation` do react-router-dom
- Substituir o `useState<string[]>([])` do `openMenus` por um estado inicializado com base na rota atual
- No init (via `useMemo` ou computação direta), percorrer `menuItems`, encontrar qual grupo tem um `submenu` cujo `url` faz match com `location.pathname` (usando `startsWith` para rotas aninhadas), e iniciar `openMenus` com esse grupo
- Adicionar `useEffect` que reage a mudanças de `location.pathname` para expandir automaticamente o grupo correto quando a navegação muda

### Lógica

```
const location = useLocation();

// Calcular grupo ativo
const activeGroup = menuItems.find(item => 
  item.submenu?.some(sub => location.pathname.startsWith(sub.url))
)?.title;

// Inicializar e atualizar openMenus para incluir o grupo ativo
useEffect(() => {
  if (activeGroup && !openMenus.includes(activeGroup)) {
    setOpenMenus(prev => [...prev, activeGroup]);
  }
}, [location.pathname]);
```

### Arquivo
- `src/components/AppSidebar.tsx`

