import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X } from "lucide-react";
import { useCategorias, useTipos, useSubcategorias } from "@/hooks/useTransacoesFinanceiras";
import type { TransacoesFilters as TFilters } from "@/types/transacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface Props {
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
}

const anoAtual = new Date().getFullYear();
const anosDisponiveis = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];

const getAnoFromRange = (dataInicio?: Date, dataFim?: Date): string => {
  if (!dataInicio || !dataFim) return "todos";
  const fromYear = dataInicio.getFullYear();
  const toYear = dataFim.getFullYear();
  if (
    fromYear === toYear &&
    dataInicio.getMonth() === 0 && dataInicio.getDate() === 1 &&
    dataFim.getMonth() === 11 && dataFim.getDate() === 31
  ) {
    return fromYear.toString();
  }
  return "personalizado";
};

export function TransacoesFilters({ filters, onFiltersChange }: Props) {
  const { data: categorias } = useCategorias();
  const { data: tipos } = useTipos();
  const { data: subcategorias } = useSubcategorias(filters.categoria_codigo);

  const dateRange: DateRange | undefined = filters.dataInicio || filters.dataFim
    ? { from: filters.dataInicio, to: filters.dataFim }
    : undefined;

  const selectedAno = getAnoFromRange(filters.dataInicio, filters.dataFim);

  const handleAnoChange = (value: string) => {
    if (value === "todos") {
      onFiltersChange({
        ...filters,
        dataInicio: undefined,
        dataFim: undefined,
        ano: undefined,
      });
    } else if (value !== "personalizado") {
      const ano = parseInt(value);
      onFiltersChange({
        ...filters,
        dataInicio: new Date(ano, 0, 1),
        dataFim: new Date(ano, 11, 31),
        ano: undefined,
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dataInicio: range?.from,
      dataFim: range?.to,
      ano: undefined,
    });
  };

  const handleClear = () => {
    onFiltersChange({});
  };

  const hasFilters =
    filters.dataInicio ||
    filters.dataFim ||
    filters.tipo_codigo ||
    filters.categoria_codigo ||
    filters.subcategoria_codigo;

  const formatDateRange = () => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`;
      }
      return format(dateRange.from, "dd/MM/yyyy");
    }
    return "Selecionar período";
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
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

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[220px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            locale={ptBR}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.tipo_codigo || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            tipo_codigo: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {tipos?.map((tipo) => (
            <SelectItem key={tipo.codigo} value={tipo.codigo}>
              {tipo.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoria_codigo || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            categoria_codigo: value === "all" ? undefined : value,
            subcategoria_codigo: undefined,
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categorias?.map((cat) => (
            <SelectItem key={cat.codigo} value={cat.codigo}>
              {cat.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.subcategoria_codigo || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            subcategoria_codigo: value === "all" ? undefined : value,
          })
        }
        disabled={!filters.categoria_codigo}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Subcategoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {subcategorias?.map((sub) => (
            <SelectItem key={sub.codigo} value={sub.codigo}>
              {sub.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}