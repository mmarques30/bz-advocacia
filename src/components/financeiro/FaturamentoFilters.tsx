import { X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClientesReceitas } from "@/hooks/useClientesFinanceiros";

export interface FaturamentoFiltersState {
  cliente: string;
  ano: number;
  dataInicio: Date | null;
  dataFim: Date | null;
  status: string;
  tipoServico: string;
}

interface FaturamentoFiltersProps {
  filters: FaturamentoFiltersState;
  onChange: (filters: FaturamentoFiltersState) => void;
}

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
  // Expandir para 10 anos para incluir dados históricos importados
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const { data: clientes = [] } = useClientesReceitas();

  const handleChange = (key: keyof FaturamentoFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      cliente: "todos",
      ano: currentYear,
      dataInicio: null,
      dataFim: null,
      status: "todos",
      tipoServico: "todos",
    });
  };

  const hasActiveFilters = 
    filters.cliente !== "todos" ||
    filters.dataInicio !== null || 
    filters.dataFim !== null ||
    filters.ano !== currentYear ||
    filters.status !== "todos" || 
    filters.tipoServico !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.cliente !== "todos") {
      labels.push(`Cliente: ${filters.cliente}`);
    }
    if (filters.dataInicio && filters.dataFim) {
      labels.push(`${format(filters.dataInicio, "dd/MM")} - ${format(filters.dataFim, "dd/MM")}/${filters.ano}`);
    } else if (filters.dataInicio) {
      labels.push(`A partir de ${format(filters.dataInicio, "dd/MM/yyyy")}`);
    } else if (filters.dataFim) {
      labels.push(`Até ${format(filters.dataFim, "dd/MM/yyyy")}`);
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
        <Select
          value={filters.cliente}
          onValueChange={(value) => handleChange("cliente", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os Clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Clientes</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente} value={cliente}>
                {cliente}
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.dataInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataInicio ? (
                format(filters.dataInicio, "dd/MM/yyyy")
              ) : (
                <span>Data Início</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataInicio || undefined}
              onSelect={(date) => handleChange("dataInicio", date || null)}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.dataFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataFim ? (
                format(filters.dataFim, "dd/MM/yyyy")
              ) : (
                <span>Data Fim</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataFim || undefined}
              onSelect={(date) => handleChange("dataFim", date || null)}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

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
  cliente: "todos",
  ano: new Date().getFullYear(),
  dataInicio: null,
  dataFim: null,
  status: "todos",
  tipoServico: "todos",
});
