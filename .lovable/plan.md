## Botão "Limpar tudo e recarregar" na tela de login

Hoje a tela `/auth` já tem dois links discretos no rodapé: **Limpar sessão** e **Recarregar sistema**. O problema é que eles fazem coisas diferentes e nenhum deles é uma "bomba nuclear" — quando o navegador do usuário está com lock travado + token corrompido + cache do Service Worker velho, nem sempre resolve no primeiro clique.

### O que vou fazer

1. **Substituir os dois links atuais por um único botão discreto** no rodapé da `src/pages/Auth.tsx`, com texto tipo **"Problemas para entrar? Limpar cache e recarregar"** (ícone `RefreshCw` do Lucide, estilo link branco translúcido, igual aos atuais).

2. **Criar uma função `nukeAndReload()`** em `src/lib/authStorage.ts` que executa **na ordem**:
   - `supabase.auth.signOut({ scope: 'local' })` — encerra sessão local.
   - `releaseAuthLocks()` — libera locks travados do GoTrue (causa #1 do "Conexão travou").
   - `localStorage.clear()` + `sessionStorage.clear()` — apaga tokens e flags.
   - `caches.delete(...)` em todos os caches do Cache Storage (PWA/SW).
   - `navigator.serviceWorker.getRegistrations()` → `unregister()` em cada um (se existir SW registrado, ele some).
   - `cookies` do domínio limpos via `document.cookie` (best-effort, só os não-HttpOnly).
   - `window.location.replace('/auth?_r=' + Date.now())` — recarrega forçando bypass de cache HTTP.

3. **Confirmação leve antes de executar**: um `window.confirm("Isso vai apagar dados locais e recarregar. Continuar?")` pra evitar clique acidental que desloga quem está só explorando.

4. **Remover o `useEffect` de auto-limpeza** que adicionei na resposta anterior (rodava em todo carregamento da `/auth`). Vira ação manual via botão, mais previsível e sem risco de loop.

### Arquivos alterados

- `src/lib/authStorage.ts` — adicionar `nukeAndReload()`.
- `src/pages/Auth.tsx` — substituir os 2 links por 1 botão; remover `useEffect` de autoclean; remover imports não usados.

### Fora do escopo

- Backend, RLS, edge functions, fluxo de senha — nada disso muda.
- Não mexo em `src/integrations/supabase/client.ts` (arquivo gerenciado).

### Como o usuário usa

Quando alguém reclamar que não consegue entrar, orientação fica simples: **"abre a tela de login e clica em 'Limpar cache e recarregar' no rodapé"**. Um clique resolve token velho, lock travado e cache de versão antiga do app.