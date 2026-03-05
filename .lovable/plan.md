

## Plano: Remover card "Convites Pendentes" da página Usuários

O card `InvitesPendentesCard` será removido da página `Usuarios.tsx`, já que não haverá fluxo de convites — os usuários são cadastrados diretamente.

### Mudança

**`src/pages/configuracoes/Usuarios.tsx`**:
- Remover o import de `InvitesPendentesCard`
- Remover o componente `<InvitesPendentesCard />` do JSX

