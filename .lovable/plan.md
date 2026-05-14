## Diagnóstico

**O que sabemos:**
- Backend (Lovable Cloud) saudável.
- `/auth/v1/token` responde em ~10–140ms quando recebe a chamada.
- Nas últimas 2 horas só uma tentativa chegou ao servidor (Mariana). Os demais usuários reclamam, mas suas requisições **não chegam ao backend**.
- O toast "Conexão travou. Recarregando o sistema…" só dispara quando `signInWithPassword` excede 12s no navegador. Combinado com "não chega ao servidor", é deadlock do cliente Supabase JS — tipicamente o lock do GoTrue (`navigator.locks`) travado por aba/sessão antiga, ou tokens corrompidos no `localStorage` que o cliente fica tentando refrescar antes de aceitar um novo login.
- O `clearSupabaseAuthStorage` atual roda **depois** da inicialização do `supabase` client, então não destrava o lock já adquirido.

## Correção (apenas frontend, sem mexer em backend nem UI)

### 1. `src/integrations/supabase/client.ts` — desativar o lock cross-tab

Esse arquivo é auto-gerado, então a mudança vai num wrapper. Criar `src/integrations/supabase/clientOptions.ts` não resolve porque ele é importado direto. A alternativa segura é alterar somente o `useAuth` e a tela de login para garantir destrave (passos 2 e 3). Se o lock continuar sendo o vilão, em segundo momento sobrescrevemos via `lock: async (_n,_a,fn)=>fn()` num arquivo dedicado e reapontamos imports.

### 2. `src/lib/authStorage.ts` — reset mais agressivo antes de logar

- Antes de qualquer `signInWithPassword`, chamar `supabase.auth.signOut({ scope: 'local' })` para soltar o lock do GoTrue e limpar o estado interno do cliente, **depois** apagar `sb-*`/`supabase.auth.*` do `localStorage` e `sessionStorage`.
- Adicionar função `releaseAuthLocks()` que tenta `navigator.locks.request('lock:sb-...-auth-token', { steal: true }, async () => {})` para qualquer lock pendente (try/catch silencioso, browsers antigos ignoram).

### 3. `src/hooks/useAuth.tsx` — fluxo de signIn mais robusto

- Antes de chamar `signInWithPassword`: rodar `releaseAuthLocks()` + `signOut({ scope: 'local' })`.
- Aumentar o timeout de 12s para 20s (rede ruim em escritório) **e separar o tratamento**:
  - Timeout real → mensagem clara "Sem resposta do servidor. Limpe os dados e tente de novo." com botão que chama `hardReloadApp` (não recarrega sozinho em loop).
  - Erro de credencial → "Email ou senha incorretos" (igual hoje).
- Remover o `setTimeout(reload, 1200)` automático do caminho TIMEOUT — recarregar sozinho mascara o problema e gera o loop visto na foto.

### 4. `src/pages/Auth.tsx` — não limpar storage automaticamente

- O `useEffect` que apaga tokens "stale" no mount está rodando **enquanto o GoTrue ainda inicializa**, o que pode deixar o cliente num estado inconsistente. Substituir por um botão visível ("Problemas para entrar? Limpar sessão") que chama `clearSupabaseAuthStorage` + `releaseAuthLocks` + reload.
- Manter o botão "Recarregar sistema" que já existe (`hardReloadApp`).

### 5. Comunicação imediata aos usuários afetados

Enquanto a correção sobe, instruir quem está travado:
1. Fechar todas as abas do sistema.
2. Abrir aba anônima (Ctrl+Shift+N) e logar — isso prova se é cache/lock local.
3. Se voltar a funcionar em anônima, na aba normal: F12 → Application → Storage → Clear site data → recarregar.

## Validação

1. Após deploy, abrir o publicado em aba anônima e logar com uma conta diferente da Mariana → deve entrar.
2. Em aba normal "infectada", clicar no novo botão "Limpar sessão" → logar novamente → deve entrar sem o toast de timeout.
3. Conferir nos logs do Supabase que aparece um POST `/token` 200 para essa conta (hoje não aparece nenhum).

## Detalhes técnicos

- **Por que não é problema de RLS/profiles:** o login falha **antes** de qualquer query autenticada. As views protegidas só são chamadas pós-`SIGNED_IN`.
- **Por que não é instância pequena:** o servidor responde em ms; se fosse compute, veríamos timeouts no servidor, não silêncio total.
- **Por que mudanças recentes da sidebar/atendimento provavelmente são gatilho indireto:** os reloads forçados (`hardReloadApp`) usados na sessão da Mariana podem ter deixado o GoTrue com lock pendente em outras abas dos usuários, e cada nova tentativa de login bate no lock e estoura os 12s do `Promise.race`.

## Fora do escopo deste plano

- Mexer em UI da tela de atendimento, sidebar ou dashboard.
- Alterar tabelas, RLS, edge functions, ou config de auth no servidor.
- Resetar senha de usuários (não é o problema).
