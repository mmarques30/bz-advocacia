import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCategorias, useTipos, useSubcategorias } from "@/hooks/useTransacoesFinanceiras";
import type { TransacoesFilters as TFilters } from "@/types/transacoes";

interface Props {
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
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

export function TransacoesFilters({ filters, onFiltersChange }: Props) {
  const { data: categorias } = useCategorias();
  const { data: tipos } = useTipos();
  const { data: subcategorias } = useSubcategorias(filters.categoria_codigo);

  const handleClear = () => {
    onFiltersChange({});
  };

  const hasFilters =
    filters.mes ||
    filters.tipo_codigo ||
    filters.categoria_codigo ||
    filters.subcategoria_codigo ||
    filters.busca;

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={filters.busca || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, busca: e.target.value || undefined })
            }
            className="pl-9"
          />
        </div>
      </div>

      <Select
        value={filters.mes?.toString() || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            mes: value === "all" ? undefined : parseInt(value),
          })
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
