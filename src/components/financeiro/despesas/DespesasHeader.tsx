import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DespesasFilters } from "./DespesasFilters";
import type { DespesasFilters as DespesasFiltersType } from "@/types/financeiro";

interface DespesasHeaderProps {
  onNewDespesa: () => void;
  filters: DespesasFiltersType;
  onFiltersChange: (filters: DespesasFiltersType) => void;
}

export function DespesasHeader({ onNewDespesa, filters, onFiltersChange }: DespesasHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Despesas</h2>
          <p className="text-muted-foreground">
            Gerencie todas as despesas do escritório
          </p>
        </div>
        <Button size="sm" onClick={onNewDespesa}>
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <DespesasFilters filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}
