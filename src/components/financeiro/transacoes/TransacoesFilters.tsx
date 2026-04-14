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
import { CONTA_LABELS } from "@/types/financeiro";

interface Props {
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
}

const ANOS_OPCOES = [2024, 2025, 2026];

export function TransacoesFilters({ filters, onFiltersChange }: Props) {
  const { data: categorias } = useCategorias();
  const { data: tipos } = useTipos();
  const { data: subcategorias } = useSubcategorias(filters.categoria_codigo);

  const dateRange: DateRange | undefined = filters.dataInicio || filters.dataFim
    ? { from: filters.dataInicio, to: filters.dataFim }
    : undefined;

  const handleAnoChange = (value: string) => {
    if (value === "todos") {
      onFiltersChange({
        ...filters,
        anos: undefined,
        dataInicio: undefined,
        dataFim: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        anos: [parseInt(value)],
        dataInicio: undefined,
        dataFim: undefined,
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dataInicio: range?.from,
      dataFim: range?.to,
      anos: undefined,
    });
  };

  const handleClear = () => {
    onFiltersChange({});
  };

  const hasFilters =
    (filters.anos && filters.anos.length > 0) ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.tipo_codigo ||
    filters.categoria_codigo ||
    filters.subcategoria_codigo ||
    filters.conta;

  const formatDateRange = () => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`;
      }
      return format(dateRange.from, "dd/MM/yyyy");
    }
    return "Selecionar período";
  };

  const getAnoValue = () => {
    if (!filters.anos || filters.anos.length === 0) return "todos";
    return filters.anos[0].toString();
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Dropdown simples de ano */}
      <Select value={getAnoValue()} onValueChange={handleAnoChange}>
        <SelectTrigger className={cn(
          "h-9 text-xs w-[130px]",
          filters.anos && filters.anos.length > 0 && "border-primary"
        )}>
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          <SelectItem value="todos">Todos os anos</SelectItem>
          {ANOS_OPCOES.map((ano) => (
            <SelectItem key={ano} value={ano.toString()}>
              {ano}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Período personalizado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 text-xs w-[180px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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
        <SelectTrigger className="h-9 text-xs w-[120px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
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
        <SelectTrigger className="h-9 text-xs w-[130px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
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
      >
        <SelectTrigger className="h-9 text-xs w-[130px]">
          <SelectValue placeholder="Subcategoria" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          <SelectItem value="all">Todas</SelectItem>
          {subcategorias?.map((sub) => (
            <SelectItem key={sub.codigo} value={sub.codigo}>
              {sub.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.conta || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            conta: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="h-9 text-xs w-[130px]">
          <SelectValue placeholder="Conta" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          <SelectItem value="all">Todas as Contas</SelectItem>
          {Object.entries(CONTA_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
