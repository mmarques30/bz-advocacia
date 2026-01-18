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

export interface FaturamentoFiltersState {
  search: string;
  mes: number | null;
  ano: number;
  status: string;
  tipoServico: string;
}

interface FaturamentoFiltersProps {
  filters: FaturamentoFiltersState;
  onChange: (filters: FaturamentoFiltersState) => void;
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

const statusOptions = [
  { value: "todos", label: "Todos os Status" },
  { value: "ativo", label: "Ativo" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const tipoServicoOptions = [
  { value: "todos", label: "Todos os Tipos" },
  { value: "consultivo", label: "Consultivo" },
  { value: "contencioso", label: "Contencioso" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "familia", label: "Família" },
  { value: "inventario", label: "Inventário" },
  { value: "divorcio", label: "Divórcio" },
];

export function FaturamentoFilters({ filters, onChange }: FaturamentoFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleChange = (key: keyof FaturamentoFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      mes: null,
      ano: currentYear,
      status: "todos",
      tipoServico: "todos",
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.mes !== null || 
    filters.ano !== currentYear ||
    filters.status !== "todos" || 
    filters.tipoServico !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.mes !== null) {
      const mesLabel = meses.find(m => m.value === filters.mes)?.label;
      labels.push(`${mesLabel} ${filters.ano}`);
    } else if (filters.ano !== currentYear) {
      labels.push(`Ano: ${filters.ano}`);
    }
    if (filters.status !== "todos") {
      labels.push(statusOptions.find(s => s.value === filters.status)?.label || "");
    }
    if (filters.tipoServico !== "todos") {
      labels.push(tipoServicoOptions.find(t => t.value === filters.tipoServico)?.label || "");
    }
    return labels.filter(Boolean);
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
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
          value={filters.status}
          onValueChange={(value) => handleChange("status", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tipoServico}
          onValueChange={(value) => handleChange("tipoServico", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            {tipoServicoOptions.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
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

export const getDefaultFaturamentoFilters = (): FaturamentoFiltersState => ({
  search: "",
  mes: null,
  ano: new Date().getFullYear(),
  status: "todos",
  tipoServico: "todos",
});
