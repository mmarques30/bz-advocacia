import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search } from "lucide-react";
import type { TagFilters as Filters, TagTipo } from "@/types/tags";
import { TIPO_LABELS } from "@/types/tags";

interface TagFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function TagFilters({ filters, onFiltersChange }: TagFiltersProps) {
  const hasActiveFilters = filters.busca || filters.tipo;

  const clearFilters = () => {
    onFiltersChange({
      busca: '',
      tipo: null,
      ordenacao: 'recente',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tags..."
          value={filters.busca || ''}
          onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.tipo || 'todos'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, tipo: value === 'todos' ? null : value as TagTipo })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          <SelectItem value="lead">{TIPO_LABELS.lead}</SelectItem>
          <SelectItem value="processo">{TIPO_LABELS.processo}</SelectItem>
          <SelectItem value="geral">{TIPO_LABELS.geral}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.ordenacao || 'recente'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, ordenacao: value as Filters['ordenacao'] })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recente">Mais recente</SelectItem>
          <SelectItem value="antigo">Mais antigo</SelectItem>
          <SelectItem value="mais-usado">Mais usado</SelectItem>
          <SelectItem value="az">A-Z</SelectItem>
          <SelectItem value="za">Z-A</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  );
}
