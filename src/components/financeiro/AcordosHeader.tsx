import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download } from "lucide-react";
import type { AcordosFilters } from "@/types/financeiro";

interface AcordosHeaderProps {
  onNewAcordo: () => void;
  filters: AcordosFilters;
  onFiltersChange: (filters: AcordosFilters) => void;
}

export function AcordosHeader({ onNewAcordo, filters, onFiltersChange }: AcordosHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button onClick={onNewAcordo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Acordo
        </Button>
      </div>
    </div>
  );
}
