import { Search, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";

export interface DespesasGlobalFiltersState {
  search: string;
  mes: number | null;
  ano: number;
  categoria: string;
  status: string;
}

interface DespesasGlobalFiltersProps {
  filters: DespesasGlobalFiltersState;
  onChange: (filters: DespesasGlobalFiltersState) => void;
}

const meses = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function DespesasGlobalFilters({ filters, onChange }: DespesasGlobalFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleChange = (key: keyof DespesasGlobalFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      mes: null,
      ano: currentYear,
      categoria: "todos",
      status: "todos",
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.mes !== null || 
    filters.ano !== currentYear ||
    filters.categoria !== "todos" || 
    filters.status !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.mes !== null) {
      const mesLabel = meses.find(m => m.value === filters.mes)?.label;
      labels.push(`${mesLabel} ${filters.ano}`);
    } else if (filters.ano !== currentYear) {
      labels.push(`Ano: ${filters.ano}`);
    }
    if (filters.categoria !== "todos") {
      labels.push(CATEGORIA_DESPESA_LABELS[filters.categoria as keyof typeof CATEGORIA_DESPESA_LABELS] || filters.categoria);
    }
    if (filters.status !== "todos") {
      labels.push(STATUS_DESPESA_LABELS[filters.status as keyof typeof STATUS_DESPESA_LABELS] || filters.status);
    }
    return labels.filter(Boolean);
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.mes?.toString() || "todos"}
            onValueChange={(value) => handleChange("mes", value === "todos" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {meses.map((mes) => (
                <SelectItem key={mes.value} value={mes.value.toString()}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.ano.toString()}
            onValueChange={(value) => handleChange("ano", parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={filters.categoria}
          onValueChange={(value) => handleChange("categoria", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Categorias</SelectItem>
            {Object.entries(CATEGORIA_DESPESA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => handleChange("status", value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {Object.entries(STATUS_DESPESA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {hasActiveFilters && getActiveFilterLabels().length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {getActiveFilterLabels().map((label, index) => (
            <Badge key={index} variant="secondary">
              {label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export const getDefaultDespesasGlobalFilters = (): DespesasGlobalFiltersState => ({
  search: "",
  mes: null,
  ano: new Date().getFullYear(),
  categoria: "todos",
  status: "todos",
});
