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
import { STATUS_DESPESA_LABELS, CONTA_LABELS } from "@/types/financeiro";
import { DateRange } from "react-day-picker";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";

export interface DespesasGlobalFiltersState {
  tipoDespesa: string;
  dateRange: DateRange | undefined;
  categoria: string;
  status: string;
  conta: string;
}

interface DespesasGlobalFiltersProps {
  filters: DespesasGlobalFiltersState;
  onChange: (filters: DespesasGlobalFiltersState) => void;
}

const tipoDespesaOptions = [
  { value: "todos", label: "Todos os Tipos" },
  { value: "fixa", label: "Fixa" },
  { value: "variavel", label: "Variável" },
];

export function DespesasGlobalFilters({ filters, onChange }: DespesasGlobalFiltersProps) {
  const { options: categoriaOptions, getLabel: getCategoriaLabel } = useCategoriasDespesa();
  const categoriasEntries = categoriaOptions.map((o) => [o.value, o.label] as [string, string]);

  const handleChange = (key: keyof DespesasGlobalFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      tipoDespesa: "todos",
      dateRange: undefined,
      categoria: "todos",
      status: "todos",
      conta: "todos",
    });
  };

  const hasActiveFilters = 
    filters.tipoDespesa !== "todos" ||
    filters.dateRange?.from !== undefined || 
    filters.dateRange?.to !== undefined ||
    filters.categoria !== "todos" || 
    filters.status !== "todos" ||
    filters.conta !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.tipoDespesa !== "todos") {
      labels.push(tipoDespesaOptions.find(t => t.value === filters.tipoDespesa)?.label || "");
    }
    if (filters.dateRange?.from && filters.dateRange?.to) {
      labels.push(`${format(filters.dateRange.from, "dd/MM/yyyy")} - ${format(filters.dateRange.to, "dd/MM/yyyy")}`);
    } else if (filters.dateRange?.from) {
      labels.push(`A partir de ${format(filters.dateRange.from, "dd/MM/yyyy")}`);
    } else if (filters.dateRange?.to) {
      labels.push(`Até ${format(filters.dateRange.to, "dd/MM/yyyy")}`);
    }
    if (filters.categoria !== "todos") {
      labels.push(getCategoriaLabel(filters.categoria));
    }
    if (filters.status !== "todos") {
      labels.push(STATUS_DESPESA_LABELS[filters.status as keyof typeof STATUS_DESPESA_LABELS] || filters.status);
    }
    return labels.filter(Boolean);
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Período (personalizado)</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 text-xs w-auto min-w-[190px] justify-start text-left font-normal",
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
                  <span>Usar o ano do topo</span>
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
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Categoria</span>
          <Select
            value={filters.categoria}
            onValueChange={(value) => handleChange("categoria", value)}
          >
            <SelectTrigger className="h-9 text-xs w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Categorias</SelectItem>
              {categoriasEntries.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Status</span>
          <Select
            value={filters.status}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger className="h-9 text-xs w-[150px]">
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
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Conta</span>
          <Select
            value={filters.conta}
            onValueChange={(value) => handleChange("conta", value)}
          >
            <SelectTrigger className="h-9 text-xs w-[150px]">
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
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
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

export const getDefaultDespesasGlobalFilters = (): DespesasGlobalFiltersState => {
  // Sem período custom por padrão: o ano vem do seletor do topo (header),
  // evitando ter dois controles de ano. Para recortes específicos (mês,
  // intervalo), o usuário usa o "Período (personalizado)".
  return {
    tipoDespesa: "todos",
    dateRange: undefined,
    categoria: "todos",
    status: "todos",
    conta: "todos",
  };
};