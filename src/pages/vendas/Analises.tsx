import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardConversao } from "@/components/dashboard/analises/DashboardConversao";
import { DashboardPerformanceCanal } from "@/components/dashboard/analises/DashboardPerformanceCanal";
import { useDateFilter } from "@/hooks/useDateFilter";

export default function VendasAnalises() {
  const { filters, setPreset, clearFilters } = useDateFilter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análises de Vendas</h1>
        <p className="text-muted-foreground">
          Análise detalhada de conversão e performance por canal
        </p>
      </div>

      <DashboardFilters
        periodo={filters.periodo}
        onPeriodoChange={setPreset}
        onClearFilters={clearFilters}
      />

      <Tabs defaultValue="conversao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversao">Análise de Conversão</TabsTrigger>
          <TabsTrigger value="canais">Performance por Canal</TabsTrigger>
        </TabsList>

        <TabsContent value="conversao">
          <DashboardConversao filters={filters} />
        </TabsContent>

        <TabsContent value="canais">
          <DashboardPerformanceCanal filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
