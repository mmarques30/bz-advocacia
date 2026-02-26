

# Plano: Diferenciar cores de "Importado" e "Outro" no gráfico

## Problema
As duas primeiras cores do array `BRAND_COLORS` (`--primary` e `--chart-1`) são ambas terra cota, resultando em cores visualmente idênticas para "Importado" e "Outro".

## Alteração

### `src/components/meta-ads/MarketingServiceDistribution.tsx`
- Reordenar o array `BRAND_COLORS` para que as cores adjacentes sejam visualmente distintas
- Nova ordem: `--primary` (terra cota), `--chart-3` (escuro), `--chart-2` (cinza), `--chart-4` (verde), `--chart-5` (amarelo), `--chart-1`, `--secondary`, `--accent`

