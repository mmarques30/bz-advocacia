

## Plano: Reorganizar Administrativo em 3 páginas agrupadas

### Estrutura atual → Nova estrutura

**Sidebar "Administrativo"** passará de 7 submenus para 3:

| Submenu | Abas internas | Rotas antigas redirecionadas |
|---------|---------------|------------------------------|
| **Cadastros** | Meu Perfil, Usuários | `/configuracoes/perfil`, `/configuracoes/usuarios` |
| **Modelos** | Modelos Chat, Listas do Sistema | `/configuracoes/whatsapp-templates`, `/configuracoes/listas` |
| **Controle** | Guia de Uso, Atualizações, Automações | `/configuracoes/guia`, `/configuracoes/atualizacoes`, `/configuracoes/automacoes` |

### Arquivos a criar

1. **`src/pages/configuracoes/Cadastros.tsx`** — Página com `<Tabs>` contendo duas abas:
   - "Meu Perfil" → renderiza `<Perfil />` (componente existente)
   - "Usuários" → renderiza `<Usuarios />` (componente existente)

2. **`src/pages/configuracoes/Modelos.tsx`** — Página com `<Tabs>` contendo duas abas:
   - "Modelos Chat" → renderiza `<ComunicacaoTemplates />` (componente existente)
   - "Listas do Sistema" → renderiza `<ListasSuspensas />` (componente existente)

3. **`src/pages/configuracoes/Controle.tsx`** — Página com `<Tabs>` contendo três abas:
   - "Guia de Uso" → renderiza `<GuiaDeUso />`
   - "Atualizações" → renderiza `<Atualizacoes />`
   - "Automações" → renderiza `<Automacoes />`

### Arquivos a editar

4. **`src/components/AppSidebar.tsx`** — Simplificar submenu "Administrativo":
   - Remover os 7 submenus atuais
   - Adicionar 3 submenus: Cadastros (`/dashboard/configuracoes/cadastros`), Modelos (`/dashboard/configuracoes/modelos`), Controle (`/dashboard/configuracoes/controle`)

5. **`src/App.tsx`** — Atualizar rotas:
   - Adicionar 3 novas rotas: `/cadastros`, `/modelos`, `/controle`
   - Manter rotas antigas com `<Navigate>` redirect para as novas (para não quebrar links existentes)

6. **`src/pages/configuracoes/index.tsx`** — Atualizar cards para apontar para as 3 novas páginas

7. **`src/lib/pagePermissions.ts`** — Atualizar `ROUTE_TO_PERMISSION` com as novas rotas

