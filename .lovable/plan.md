

# Correção: Remover mensagem "Parabéns! Você está em dia"

## Problema

A mensagem que aparece no painel ("Parabéns! Você está em dia. Nenhuma pendência urgente no momento.") vem do componente **UserPendenciasCards**, não do PropostasInteligentes. Quando o usuário não tem pendências (tarefas atrasadas, pagamentos, processos), o sistema exibe um card verde grande que não traz nenhuma informação útil.

## Solução

Quando não houver pendências, o componente simplesmente não renderiza nada (retorna `null`), igual ao que foi feito no PropostasInteligentes. O card só aparece quando há pendências reais para mostrar.

## Alteração

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/UserPendenciasCards.tsx` | Linhas 146-159: trocar o bloco do card verde "Parabéns" por `return null` |

## Detalhe Técnico

No arquivo `src/components/dashboard/UserPendenciasCards.tsx`, o trecho nas linhas 146-159 será substituído por:

```text
if (totalPendencias === 0) {
  return null;
}
```

Isso remove o card verde com a mensagem e o ícone de check, mantendo o componente invisível quando não há pendências — comportamento consistente com o PropostasInteligentes.
