

# Plano: Ajustar gráfico Distribuição por Serviço

## Problema
- As cores estão repetidas/similares (muitas em tons de marrom/terra cota)
- Labels com nome+percentual ficam visíveis sempre, poluindo o gráfico
- "Importado" aparece como 78% dominando visualmente

## Alterações

### `src/components/meta-ads/MarketingServiceDistribution.tsx`
- Expandir `BRAND_COLORS` para ter cores bem distintas entre si (terra cota, verde, azul, laranja, roxo, amarelo, rosa, cinza escuro, etc.)
- Remover `label` e `labelLine` do `<Pie>` — informações só aparecem ao passar o mouse (Tooltip)
- Manter a `Legend` com as cores correspondentes para identificação
- Ajustar o Tooltip para mostrar nome, quantidade e percentual ao clicar/hover

