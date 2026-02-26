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
import { DateRange } from "react-day-picker";
import { CONTA_LABELS } from "@/types/financeiro";

export interface FaturamentoFiltersState {
  cliente: string;
  dateRange: DateRange | undefined;
  status: string;
  tipoServico: string;
  conta: string;
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

const anoAtual = new Date().getFullYear();
const anosDisponiveis = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];

const getAnoFromRange = (range: DateRange | undefined): string => {
  if (!range?.from || !range?.to) return "todos";
  const fromYear = range.from.getFullYear();
  const toYear = range.to.getFullYear();
  if (
    fromYear === toYear &&
    range.from.getMonth() === 0 && range.from.getDate() === 1 &&
    range.to.getMonth() === 11 && range.to.getDate() === 31
  ) {
    return fromYear.toString();
  }
  return "personalizado";
};

export function FaturamentoFilters({ filters, onChange }: FaturamentoFiltersProps) {
  const { data: clientes = [] } = useClientesReceitas();

  const handleChange = (key: keyof FaturamentoFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleAnoChange = (value: string) => {
    if (value === "todos") {
      handleChange("dateRange", undefined);
    } else if (value !== "personalizado") {
      const ano = parseInt(value);
      handleChange("dateRange", {
        from: new Date(ano, 0, 1),
        to: new Date(ano, 11, 31),
      });
    }
  };

  const clearFilters = () => {
    onChange({
      cliente: "todos",
      dateRange: undefined,
      status: "todos",
      tipoServico: "todos",
      conta: "todos",
    });
  };

  const selectedAno = getAnoFromRange(filters.dateRange);

  const hasActiveFilters = 
    filters.cliente !== "todos" ||
    filters.dateRange?.from !== undefined || 
    filters.dateRange?.to !== undefined ||
    filters.status !== "todos" || 
    filters.tipoServico !== "todos" ||
    filters.conta !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.cliente !== "todos") {
      labels.push(`Cliente: ${filters.cliente}`);
    }
    if (filters.dateRange?.from && filters.dateRange?.to) {
      labels.push(`${format(filters.dateRange.from, "dd/MM/yyyy")} - ${format(filters.dateRange.to, "dd/MM/yyyy")}`);
    } else if (filters.dateRange?.from) {
      labels.push(`A partir de ${format(filters.dateRange.from, "dd/MM/yyyy")}`);
    } else if (filters.dateRange?.to) {
      labels.push(`Até ${format(filters.dateRange.to, "dd/MM/yyyy")}`);
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
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={selectedAno} onValueChange={handleAnoChange}>
          <SelectTrigger className="h-9 text-xs w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {anosDisponiveis.map((ano) => (
              <SelectItem key={ano} value={ano.toString()}>
                {ano}
              </SelectItem>
            ))}
            {selectedAno === "personalizado" && (
              <SelectItem value="personalizado" disabled>
                Personalizado
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select
          value={filters.cliente}
          onValueChange={(value) => handleChange("cliente", value)}
        >
          <SelectTrigger className="h-9 text-xs w-[140px]">
            <SelectValue placeholder="Cliente" />
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 text-xs w-[180px] justify-start text-left font-normal",
                !filters.dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "dd/MM/yyyy")} - {format(filters.dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(filters.dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => handleChange("dateRange", range)}
              numberOfMonths={2}
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
          <SelectTrigger className="h-9 text-xs w-[130px]">
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
          <SelectTrigger className="h-9 text-xs w-[130px]">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            {tipoServicoOptions.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.conta}
          onValueChange={(value) => handleChange("conta", value)}
        >
          <SelectTrigger className="h-9 text-xs w-[130px]">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Contas</SelectItem>
            {Object.entries(CONTA_LABELS).map(([value, label]) => (
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

export const getDefaultFaturamentoFilters = (): FaturamentoFiltersState => ({
  cliente: "todos",
  dateRange: undefined,
  status: "todos",
  tipoServico: "todos",
  conta: "todos",
});