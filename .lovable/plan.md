

# Correcao: Remover mensagem "Tudo em ordem" das Propostas Inteligentes

## Problema

Quando nao ha alertas ou sugestoes de acao, o card "Sugestoes de Acao" exibe uma mensagem "Tudo em ordem! Nenhuma acao urgente identificada no momento." com um icone de check verde. Isso nao faz sentido porque o sistema pode simplesmente nao ter dados suficientes ou o usuario acabou de entrar.

## Solucao

Quando `propostas.length === 0`, o componente `PropostasInteligentes` simplesmente retorna `null` -- ou seja, nao renderiza nada. Sem card vazio, sem mensagem desnecessaria.

## Alteracao

| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/PropostasInteligentes.tsx` | Retornar `null` quando `propostas` estiver vazio (remover bloco "Tudo em ordem") |

## Detalhe Tecnico

No componente, adicionar um early return antes do JSX:

```text
if (!loading && propostas.length === 0) {
  return null;
}
```

E remover o bloco condicional interno que exibe "Tudo em ordem!" (linhas 72-81 do arquivo atual).

