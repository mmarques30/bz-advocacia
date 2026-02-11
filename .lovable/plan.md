
# Remover cores vibrantes dos icones na aba Marketing

## Problema

Os componentes de Marketing usam icones com cores vibrantes (azul, verde, roxo, laranja, ciano, vermelho, amber, emerald), quebrando o padrao visual do projeto que deve ser neutro e profissional.

## Alteracoes

### 1. `src/pages/vendas/MetaAds.tsx` - ROICard

- Remover cores individuais dos icones (`text-red-500`, `text-blue-500`, `text-amber-500`, `text-emerald-500`)
- Remover backgrounds coloridos (`bg-red-500/10`, `bg-blue-500/10`, etc.)
- Usar `text-muted-foreground` para todos os icones e `bg-muted` para os backgrounds
- Remover gradiente do Card (`bg-gradient-to-r from-primary/5 to-transparent` e `border-primary/20`)
- Remover icone `text-primary` do titulo "Resumo de ROI"

### 2. `src/components/meta-ads/MetaAdsKPIs.tsx`

- Substituir todas as cores dos icones (`text-blue-600`, `text-green-600`, `text-purple-600`, `text-orange-600`, `text-cyan-600`) por `text-muted-foreground`
- Manter apenas as cores de variacao (verde para positivo, vermelho para negativo) pois sao indicadores funcionais, nao decorativos

### 3. `src/components/meta-ads/MetaAdsChart.tsx`

- Nenhuma alteracao necessaria, as cores do grafico sao funcionais (diferenciar linhas)

## Resultado

Icones neutros (`text-muted-foreground`) em todos os cards, alinhados com o padrao visual do restante da aplicacao. Apenas indicadores de tendencia (positivo/negativo) mantem cor funcional.
