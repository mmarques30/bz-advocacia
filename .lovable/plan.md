

# Plano: Converter funil de conversão para formato tabela estratégica

## Alterações

### 1. `MarketingFunnelChart.tsx` — Reescrever como tabela estratégica
- Substituir barras horizontais por uma tabela com colunas: **Etapa**, **Leads**, **% do Total**, **Taxa de Evolução** (% de passagem entre etapas)
- Usar barra de progresso inline com cor `primary` (bronze) para representar visualmente a proporção
- Calcular taxa de evolução: `(leads_etapa_atual / leads_etapa_anterior) * 100`
- Destacar a última linha (Convertido) com cor `success` (verde)
- Usar cores da marca: `hsl(var(--primary))` para barras, `hsl(var(--chart-4))` para conversão final

### 2. Cores aplicadas
- Barras de progresso: `bg-primary` (bronze B&Z)
- Texto de percentuais positivos: `text-primary`
- Linha de conversão final: destaque em verde (`chart-4`)
- Headers da tabela: `text-muted-foreground` (cinza B&Z)

### Arquivos alterados
| Arquivo | Alteração |
|---|---|
| `MarketingFunnelChart.tsx` | Reescrever: gráfico → tabela estratégica com % evolução |

