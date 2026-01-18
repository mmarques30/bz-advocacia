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
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";

export interface DespesasGlobalFiltersState {
  tipoDespesa: string;
  ano: number;
  dataInicio: Date | null;
  dataFim: Date | null;
  categoria: string;
  status: string;
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
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleChange = (key: keyof DespesasGlobalFiltersState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      tipoDespesa: "todos",
      ano: currentYear,
      dataInicio: null,
      dataFim: null,
      categoria: "todos",
      status: "todos",
    });
  };

  const hasActiveFilters = 
    filters.tipoDespesa !== "todos" ||
    filters.dataInicio !== null || 
    filters.dataFim !== null ||
    filters.ano !== currentYear ||
    filters.categoria !== "todos" || 
    filters.status !== "todos";

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.tipoDespesa !== "todos") {
      labels.push(tipoDespesaOptions.find(t => t.value === filters.tipoDespesa)?.label || "");
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
  tipoDespesa: "todos",
  ano: new Date().getFullYear(),
  dataInicio: null,
  dataFim: null,
  categoria: "todos",
  status: "todos",
});
