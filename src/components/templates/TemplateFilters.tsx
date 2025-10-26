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
import type { TemplateFilters as Filters } from "@/types/templates";

interface TemplateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function TemplateFilters({ filters, onFiltersChange }: TemplateFiltersProps) {
  const hasActiveFilters = filters.busca || filters.categoria || filters.ativo !== null;

  const clearFilters = () => {
    onFiltersChange({
      busca: '',
      categoria: '',
      ativo: null,
      ordenacao: 'recente',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={filters.busca || ''}
            onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.ativo === null ? 'todos' : filters.ativo ? 'ativo' : 'inativo'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              ativo: value === 'todos' ? null : value === 'ativo' 
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.ordenacao || 'recente'}
          onValueChange={(value: any) => onFiltersChange({ ...filters, ordenacao: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recente">Mais recente</SelectItem>
            <SelectItem value="antigo">Mais antigo</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
            <SelectItem value="za">Z-A</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
