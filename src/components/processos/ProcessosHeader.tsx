import { Search, Filter, Plus, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessosFilters } from "@/types/processos";

interface ProcessosHeaderProps {
  filters: ProcessosFilters;
  onFiltersChange: (filters: ProcessosFilters) => void;
  onOpenFilters: () => void;
  onNewProcesso: () => void;
  onViewPrazos: () => void;
  activeFiltersCount: number;
}

export function ProcessosHeader({
  filters,
  onFiltersChange,
  onOpenFilters,
  onNewProcesso,
  onViewPrazos,
  activeFiltersCount,
}: ProcessosHeaderProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button onClick={onNewProcesso} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Processo
      </Button>

      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, cliente ou tipo..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Button variant="outline" onClick={onOpenFilters} className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Button variant="outline" onClick={onViewPrazos} className="gap-2">
        <Calendar className="h-4 w-4" />
        Ver Prazos
      </Button>
    </div>
  );
}
