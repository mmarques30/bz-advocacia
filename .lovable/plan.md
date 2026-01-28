

# Plano: Visão Complementar de Performance na Aba Alertas

## Objetivo
Adicionar uma seção complementar abaixo dos três cards existentes na aba "Alertas" que combina:
1. **Distribuição por Responsável** - Volume de demandas por membro da equipe
2. **Indicadores de Performance** - Taxa de conclusão, tempo médio e comparativo criação vs conclusão

## Estrutura Proposta

A nova seção será adicionada abaixo da grade de 3 cards existentes:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  CARDS EXISTENTES (3 colunas)                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │ Alertas        │  │ Minhas         │  │ Próximos       │              │
│  │ Importantes    │  │ Demandas       │  │ 7 Dias         │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
├──────────────────────────────────────────────────────────────────────────┤
│  NOVA SEÇÃO: Performance e Distribuição (2 colunas)                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐        │
│  │ Indicadores do Mês          │  │ Distribuição por            │        │
│  │                             │  │ Responsável                 │        │
│  │ • Taxa Conclusão: 85%      │  │                             │        │
│  │ • Tempo Médio: 3.2 dias    │  │ [Gráfico barras horizontal] │        │
│  │ • Criadas: 12 | Concluídas:│  │                             │        │
│  │             10             │  │                             │        │
│  └─────────────────────────────┘  └─────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Detalhamento Técnico

### 1. Novo Hook: `useDemandasPerformance`

Criação de um hook dedicado para buscar métricas de performance:

```typescript
// Métricas retornadas:
{
  taxaConclusao: number;        // % de demandas concluídas no mês
  tempoMedioConclusao: number;  // Dias entre criação e conclusão
  criadasNoMes: number;         // Total criadas no mês atual
  concluidasNoMes: number;      // Total concluídas no mês atual
  distribuicaoPorResponsavel: Array<{
    nome: string;
    total: number;
    atrasadas: number;
    concluidas: number;
  }>;
}
```

**Queries necessárias:**
- Demandas criadas no mês atual
- Demandas concluídas no mês atual (com `data_conclusao`)
- Agrupamento por `responsavel_id` com JOIN em `profiles`
- Cálculo de tempo médio usando `data_conclusao - created_at`

### 2. Novo Componente: `PerformanceIndicators`

Card com indicadores rápidos do mês:

| Indicador | Descrição | Visualização |
|-----------|-----------|--------------|
| Taxa de Conclusão | % concluídas/total ativas | Número grande + barra de progresso |
| Tempo Médio | Dias entre criação e conclusão | Número + label "dias" |
| Criadas vs Concluídas | Comparativo mensal | Dois badges lado a lado |

**Estilo:**
- Fundo do card: branco com borda sutil
- Números: fonte grande (`text-3xl`), cor primary para destaque
- Barra de progresso: cores da paleta B&Z (bronze/terra cota)

### 3. Novo Componente: `DistribuicaoResponsavel`

Gráfico de barras horizontais mostrando demandas por pessoa:

- **Eixo Y**: Nome do responsável
- **Eixo X**: Quantidade de demandas
- **Cores**: 
  - Barra principal: `chartColors.primary` (bronze)
  - Segmento atrasadas: `chartColors.danger` (vermelho)
- **Biblioteca**: Recharts (já utilizado no projeto)

### 4. Integração no `AlertasUnificados.tsx`

Adicionar a nova seção logo após a grade de cards:

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards existentes */}
</div>

{/* Nova seção de Performance */}
<div className="mt-6 grid gap-6 md:grid-cols-2">
  <PerformanceIndicators data={performance} loading={loading} />
  <DistribuicaoResponsavel data={distribuicao} loading={loading} />
</div>
```

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useDemandasPerformance.ts` | Criar |
| `src/components/demandas/PerformanceIndicators.tsx` | Criar |
| `src/components/demandas/DistribuicaoResponsavel.tsx` | Criar |
| `src/components/demandas/AlertasUnificados.tsx` | Modificar |

## Consistência Visual

- Utilizará a paleta de cores definida em `chartConfig.ts`
- Seguirá o padrão de Cards do projeto (shadcn/ui)
- Gráficos com mesmo estilo visual do módulo Financeiro
- Skeleton loaders durante carregamento
- Estados vazios com ícones e mensagens amigáveis

## Responsividade

- **Desktop (lg+)**: Seção original em 3 colunas, nova seção em 2 colunas
- **Tablet (md)**: Seção original em 2 colunas, nova seção em 2 colunas
- **Mobile**: Tudo empilhado em 1 coluna

