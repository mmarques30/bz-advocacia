
# Plano: Reorganizar layout da aba Campanhas & Custos

## Alterações em `src/components/meta-ads/MarketingCampanhasCustos.tsx`

### 1. Reordenar seções (nova ordem vertical, tudo full-width)
1. KPI Cards (mantém)
2. Evolução de Leads por Dia (mantém)
3. **Performance por Campanha** — tabela movida para abaixo do gráfico de evolução
4. **Distribuição por Plataforma** — movida para abaixo da tabela de campanhas

### 2. Tabela Performance por Campanha
- Limitar exibição a **5 linhas** (atualmente 8)
- Adicionar estado `showAllCampaigns` com `useState(false)`
- Quando `false`, exibe `campaigns.slice(0, 5)`; quando `true`, exibe todas
- Adicionar botão "Ver mais" abaixo da tabela quando há mais de 5 campanhas (texto muda para "Ver menos" quando expandido)

### 3. Distribuição por Plataforma
- Trocar de **PieChart** (rosca) para **BarChart** vertical (colunas)
- Eixo X: plataformas (label); Eixo Y: quantidade de leads
- Cada barra com cor distinta via `Cell` + `PIE_COLORS`
- Card ocupa largura total (remover grid `lg:grid-cols-2`)

### 4. Remover grid `lg:grid-cols-2` que agrupava Platform + Campaign
- Ambos os cards ficam em coluna única, sequenciais
