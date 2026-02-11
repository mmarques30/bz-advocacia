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
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS, CONTA_LABELS } from "@/types/financeiro";
import { DateRange } from "react-day-picker";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";

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

export function DespesasGlobalFilters({ filters, onChange }: DespesasGlobalFiltersProps) {
  const { data: categoriasDespesaDb } = useOpcoesSistema('categoria_despesa', true);

  const categoriasEntries = categoriasDespesaDb && categoriasDespesaDb.length > 0
    ? categoriasDespesaDb.map(o => [o.valor, o.label] as [string, string])
    : Object.entries(CATEGORIA_DESPESA_LABELS);

  const handleChange = (key: keyof DespesasGlobalFiltersState, value: any) => {
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
      tipoDespesa: "todos",
      dateRange: undefined,
      categoria: "todos",
      status: "todos",
      conta: "todos",
    });
  };

  const selectedAno = getAnoFromRange(filters.dateRange);

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
        <Select value={selectedAno} onValueChange={handleAnoChange}>
          <SelectTrigger className="w-[120px]">
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
          value={filters.tipoDespesa}
          onValueChange={(value) => handleChange("tipoDespesa", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipoDespesaOptions.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
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
          value={filters.categoria}
          onValueChange={(value) => handleChange("categoria", value)}
        >
          <SelectTrigger className="w-[160px]">
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

        <Select
          value={filters.conta}
          onValueChange={(value) => handleChange("conta", value)}
        >
          <SelectTrigger className="w-[160px]">
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

export const getDefaultDespesasGlobalFilters = (): DespesasGlobalFiltersState => ({
  tipoDespesa: "todos",
  dateRange: undefined,
  categoria: "todos",
  status: "todos",
  conta: "todos",
});