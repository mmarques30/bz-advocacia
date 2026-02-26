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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, X, ChevronDown } from "lucide-react";
import { useCategorias, useTipos, useSubcategorias, useAnosDisponiveis } from "@/hooks/useTransacoesFinanceiras";
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

export function TransacoesFilters({ filters, onFiltersChange }: Props) {
  const { data: categorias } = useCategorias();
  const { data: tipos } = useTipos();
  const { data: subcategorias } = useSubcategorias(filters.categoria_codigo);
  const { data: anosDisponiveis, isLoading: loadingAnos } = useAnosDisponiveis();

  const dateRange: DateRange | undefined = filters.dataInicio || filters.dataFim
    ? { from: filters.dataInicio, to: filters.dataFim }
    : undefined;

  // Função para toggle de ano no array
  const handleAnoToggle = (ano: number, checked: boolean) => {
    const currentAnos = filters.anos || [];
    let newAnos: number[];
    
    if (checked) {
      newAnos = [...currentAnos, ano].sort((a, b) => b - a);
    } else {
      newAnos = currentAnos.filter(a => a !== ano);
    }
    
    onFiltersChange({
      ...filters,
      anos: newAnos.length > 0 ? newAnos : undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
  };

  // Limpar seleção de anos (mostrar todos)
  const handleClearAnos = () => {
    onFiltersChange({
      ...filters,
      anos: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dataInicio: range?.from,
      dataFim: range?.to,
      anos: undefined, // Limpar seleção de anos quando usar período personalizado
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

  // Gera o texto do botão de anos
  const getAnosLabel = () => {
    if (!filters.anos || filters.anos.length === 0) {
      return "Todos os anos";
    }
    if (filters.anos.length === 1) {
      return String(filters.anos[0]);
    }
    if (filters.anos.length === 2) {
      return filters.anos.sort((a, b) => b - a).join(", ");
    }
    return `${filters.anos.length} anos`;
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Multi-select de anos */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-between text-left font-normal",
              filters.anos && filters.anos.length > 0 && "border-primary"
            )}
          >
            <span className="truncate">{getAnosLabel()}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 z-50 bg-popover" align="start">
          <div className="p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={handleClearAnos}
            >
              Todos os anos
            </Button>
          </div>
          <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
            {loadingAnos ? (
              <div className="text-sm text-muted-foreground p-2">Carregando...</div>
            ) : (
              (anosDisponiveis || []).map((ano) => (
                <label
                  key={ano}
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                >
                  <Checkbox
                    checked={(filters.anos || []).includes(ano)}
                    onCheckedChange={(checked) => handleAnoToggle(ano, !!checked)}
                  />
                  <span className="text-sm">{ano}</span>
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Período personalizado */}
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
        <SelectTrigger className="w-[130px]">
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
        <SelectTrigger className="w-[150px]">
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
        <SelectTrigger className="w-[150px]">
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
        <SelectTrigger className="w-[160px]">
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
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
