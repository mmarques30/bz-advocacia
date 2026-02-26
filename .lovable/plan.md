

# Plano: KPIs de Marketing em formato carrossel

## Problema
Os 7 cards de KPI em `MarketingDashboardKPIs.tsx` são exibidos em grid, ocupando muito espaço vertical na página "Performance & ROI".

## Solução

### `MarketingDashboardKPIs.tsx`
- Substituir o `div` grid por `Carousel` + `CarouselContent` + `CarouselItem` (já disponível em `src/components/ui/carousel.tsx` com `embla-carousel-react`)
- Cada `CarouselItem` mostra 4 cards lado a lado (`basis-1/4` no desktop, `basis-1/2` no mobile)
- Adicionar `CarouselPrevious` e `CarouselNext` com posicionamento ajustado para não sair da área visível
- Configurar `opts={{ align: "start", loop: true }}` para navegação contínua

### Resultado
- Desktop: 4 cards visíveis por vez, seta para ver os 3 restantes
- Mobile: 2 cards visíveis por vez, navega com setas

