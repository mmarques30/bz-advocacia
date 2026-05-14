## Diagnóstico

O login funciona em aba anônima e trava em "Entrando..." nas abas normais das usuárias. Isso é o sintoma clássico de **um destes três problemas de cache do navegador**:

1. **Token Supabase corrompido/expirado** salvo em `localStorage` (chaves `sb-*-auth-token`). O SDK tenta usar esse token antigo, fica em loop tentando renovar e o `signInWithPassword` nunca resolve a Promise.
2. **Bundle JS antigo** servido pelo cache HTTP do navegador, apontando para uma versão antiga das Edge Functions / schema (referências a tabelas/colunas que mudaram).
3. **Sem timeout** no `signIn`: se a chamada travar, o botão fica eterno em "Entrando..." sem mostrar erro, sem permitir nova tentativa.

Não há service worker no projeto, então o problema está em `localStorage` + cache HTTP do `index.html`.

## O que vou fazer

### 1. Limpeza automática de token corrompido na tela de Auth (`src/pages/Auth.tsx` + `src/hooks/useAuth.tsx`)
- Ao montar `/auth`, se `getSession()` retornar `null` mas existirem chaves `sb-*` no `localStorage`, **remover essas chaves** (token podre) antes de qualquer outra coisa.
- Isso recupera automaticamente quem está com token quebrado, sem precisar saber abrir DevTools.

### 2. Timeout + recuperação no `signIn` (`src/hooks/useAuth.tsx`)
- Envolver `supabase.auth.signInWithPassword` em `Promise.race` com timeout de 12s.
- Se estourar: limpar chaves `sb-*` do `localStorage`, mostrar toast "Sessão expirou. Recarregando…" e `window.location.reload()`.
- Garante que o botão nunca trava eternamente.

### 3. Botão visível "Recarregar sistema" no rodapé do card de login (`src/pages/Auth.tsx`)
- Texto pequeno: "Problemas para entrar? **Recarregar sistema**".
- Ao clicar: limpa `localStorage`, `sessionStorage`, `caches.delete()` em todos os caches do CacheStorage e força `window.location.reload()`. 
- Solução à mão para qualquer travamento futuro, sem precisar ensinar Ctrl+Shift+R.

### 4. Cache-busting do `index.html` (`index.html`)
- Adicionar meta tags:
  ```
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  ```
- O `index.html` sempre pega versão fresca → os hashes dos chunks JS/CSS sempre apontam para o build atual. Os assets com hash continuam sendo cacheados normalmente (rápido).

### 5. Detecção de bundle desatualizado em runtime (`src/lib/versionCheck.ts` novo + `src/App.tsx`)
- A cada 5 minutos, fazer `fetch('/index.html', {cache:'no-store'})` e comparar o hash do script principal contra o que está rodando.
- Se mudou: mostrar toast persistente "Nova versão disponível" com botão "Atualizar" → `window.location.reload()`.
- Resolve o caso de usuária que deixa a aba aberta o dia inteiro depois de um deploy.

## Smoke tests que vou rodar

- Abrir Auth com `localStorage` populado por token inválido → deve limpar e permitir login normal.
- Botão "Recarregar sistema" → confirmar que limpa storages e recarrega.
- Login normal continua funcionando em aba anônima e aba comum.
- Build sem erros de TS.

## Arquivos que serão alterados

- `src/pages/Auth.tsx` — limpeza on-mount + botão "Recarregar sistema"
- `src/hooks/useAuth.tsx` — timeout no signIn + limpeza de token podre
- `src/lib/versionCheck.ts` — novo, hook de versão
- `src/App.tsx` — registrar version check
- `index.html` — meta tags no-cache

Nenhuma alteração de schema, RLS ou Edge Function. Só frontend.
