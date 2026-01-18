import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface HistoricoFiltersState {
  ano: number | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  tipo: string | null;
  categoria: string | null;
}

interface Props {
  filters: HistoricoFiltersState;
  onChange: (filters: HistoricoFiltersState) => void;
}

export function getDefaultHistoricoFilters(): HistoricoFiltersState {
  return {
    ano: null, // Sem filtro por padrão
    dataInicio: null,
    dataFim: null,
    tipo: null,
    categoria: null,
  };
}

export function HistoricoFilters({ filters, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  // Anos de 2020 até o ano atual
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

  const handleClear = () => {
    onChange(getDefaultHistoricoFilters());
  };

  const hasActiveFilters =
    filters.dataInicio !== null ||
    filters.dataFim !== null ||
    filters.tipo !== null ||
    filters.categoria !== null ||
    filters.ano !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.ano?.toString() || "all"}
        onValueChange={(value) => onChange({ 
          ...filters, 
          ano: value === "all" ? null : parseInt(value),
          dataInicio: null,
          dataFim: null,
        })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Todos Anos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Anos</SelectItem>
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
            onSelect={(date) => onChange({ ...filters, dataInicio: date || null })}
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
            onSelect={(date) => onChange({ ...filters, dataFim: date || null })}
            locale={ptBR}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.tipo || "all"}
        onValueChange={(value) =>
          onChange({ ...filters, tipo: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="receita">Receita</SelectItem>
          <SelectItem value="despesa">Despesa</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.categoria || "all"}
        onValueChange={(value) =>
          onChange({ ...filters, categoria: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="pf">Pessoa Física</SelectItem>
          <SelectItem value="pj">Pessoa Jurídica</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
