import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardAnalises } from "@/components/dashboard/analises/DashboardAnalises";
import { useDateFilter } from "@/hooks/useDateFilter";

export default function VendasAnalises() {
  const { filters, setPreset, clearFilters } = useDateFilter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Análises de Vendas</h1>
        <p className="text-muted-foreground">
          Análise detalhada de conversão e performance por canal
        </p>
      </div>

      <DashboardFilters
        periodo={filters.periodo}
        onPeriodoChange={setPreset}
        onClearFilters={clearFilters}
      />

      <DashboardAnalises filters={filters} />
    </div>
  );
}
