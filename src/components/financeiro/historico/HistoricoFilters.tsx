import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface HistoricoFiltersState {
  ano: number;
  mes: number | null;
  tipo: string | null;
  categoria: string | null;
  busca: string;
}

interface Props {
  filters: HistoricoFiltersState;
  onChange: (filters: HistoricoFiltersState) => void;
}

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function getDefaultHistoricoFilters(): HistoricoFiltersState {
  return {
    ano: new Date().getFullYear(),
    mes: null,
    tipo: null,
    categoria: null,
    busca: "",
  };
}

export function HistoricoFilters({ filters, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleClear = () => {
    onChange(getDefaultHistoricoFilters());
  };

  const hasActiveFilters =
    filters.mes !== null ||
    filters.tipo !== null ||
    filters.categoria !== null ||
    filters.busca !== "";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição..."
          value={filters.busca}
          onChange={(e) => onChange({ ...filters, busca: e.target.value })}
          className="pl-10"
        />
      </div>

      <Select
        value={filters.ano.toString()}
        onValueChange={(value) => onChange({ ...filters, ano: parseInt(value) })}
      >
        <SelectTrigger className="w-[120px]">
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

      <Select
        value={filters.mes?.toString() || "all"}
        onValueChange={(value) =>
          onChange({ ...filters, mes: value === "all" ? null : parseInt(value) })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          {MESES.map((mes) => (
            <SelectItem key={mes.value} value={mes.value}>
              {mes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
