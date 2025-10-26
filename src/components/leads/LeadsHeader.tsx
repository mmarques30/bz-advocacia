import { Plus, Search, Filter, Table2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface LeadsHeaderProps {
  view: 'table' | 'kanban';
  onViewChange: (view: 'table' | 'kanban') => void;
  onOpenFilters: () => void;
  onNewLead: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  activeFiltersCount: number;
}

export function LeadsHeader({
  view,
  onViewChange,
  onOpenFilters,
  onNewLead,
  search,
  onSearchChange,
  activeFiltersCount,
}: LeadsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-[300px]">
        <Button onClick={onNewLead}>
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, email ou telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={onOpenFilters} className="relative">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v as 'table' | 'kanban')}>
        <ToggleGroupItem value="table" aria-label="Visualização em tabela">
          <Table2 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="kanban" aria-label="Visualização em kanban">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
