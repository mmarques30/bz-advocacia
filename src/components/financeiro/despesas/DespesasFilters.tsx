import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DespesasFilters as DespesasFiltersType, CategoriaDespesa, StatusDespesa } from "@/types/financeiro";
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";

interface DespesasFiltersProps {
  filters: DespesasFiltersType;
  onFiltersChange: (filters: DespesasFiltersType) => void;
}

export function DespesasFilters({ filters, onFiltersChange }: DespesasFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof DespesasFiltersType];
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Descrição..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={filters.categoria?.[0] || "all"}
            onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                categoria: value === "all" ? undefined : [value as CategoriaDespesa]
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CATEGORIA_DESPESA_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status?.[0] || "all"}
            onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                status: value === "all" ? undefined : [value as StatusDespesa]
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_DESPESA_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.data_inicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.data_inicio ? format(filters.data_inicio, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.data_inicio}
                  onSelect={(date) => onFiltersChange({ ...filters, data_inicio: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.data_fim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.data_fim ? format(filters.data_fim, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.data_fim}
                  onSelect={(date) => onFiltersChange({ ...filters, data_fim: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {filters.search && (
            <Badge variant="secondary">
              Busca: {filters.search}
              <button
                onClick={() => onFiltersChange({ ...filters, search: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.categoria && filters.categoria.length > 0 && (
            <Badge variant="secondary">
              {CATEGORIA_DESPESA_LABELS[filters.categoria[0]]}
              <button
                onClick={() => onFiltersChange({ ...filters, categoria: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && filters.status.length > 0 && (
            <Badge variant="secondary">
              {STATUS_DESPESA_LABELS[filters.status[0]]}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
