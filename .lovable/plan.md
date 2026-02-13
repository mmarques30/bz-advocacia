

# Corrigir Criacao de Usuarios

## Problema

Dois erros ocorriam ao criar usuarios:

1. **Enum invalido `"user"`** -- ja corrigido no ultimo edit (agora envia `"advogado"`)
2. **Email duplicado** -- o email `ggiacomini2012@gmail.com` ja existe no sistema (auth + profile + role `advogado`). Ao tentar recria-lo, o Supabase Auth rejeita com "email already registered"

Alem disso, a edge function tem dois problemas remanescentes:
- **CORS incompleto** -- faltam os headers do Supabase client (mesmo problema corrigido nas outras functions)
- **Mensagens de erro em ingles** -- o usuario ve "A user with this email address has already been registered" ao inves de uma mensagem em portugues

## Alteracoes

### 1. `supabase/functions/create-user/index.ts`

**a) Atualizar CORS headers** (linha 6):
```
De: "authorization, x-client-info, apikey, content-type"
Para: "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

**b) Traduzir erro de email duplicado** (no catch, linhas 69-72):
Antes de lancar o `authError`, verificar se o codigo e `email_exists` e lancar uma mensagem amigavel em portugues:

```typescript
if (authError) {
  if (authError.code === "email_exists") {
    throw new Error("Ja existe um usuario cadastrado com este email");
  }
  throw authError;
}
```

### 2. Reimplantar a edge function

Apos as alteracoes, reimplantar `create-user` para aplicar as correcoes.

### Resultado

- Criacao de novos usuarios funcionara normalmente com roles validos
- Tentativas de cadastrar email duplicado mostrarao mensagem em portugues
- CORS compativel com o Supabase client atual

