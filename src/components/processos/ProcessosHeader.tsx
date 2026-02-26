import { Search, Filter, Plus, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcessosFilters } from "@/types/processos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProcessosHeaderProps {
  filters: ProcessosFilters;
  onFiltersChange: (filters: ProcessosFilters) => void;
  onOpenFilters: () => void;
  onNewProcesso: () => void;
  onViewPrazos: () => void;
  activeFiltersCount: number;
}

export function ProcessosHeader({
  filters,
  onFiltersChange,
  onOpenFilters,
  onNewProcesso,
  onViewPrazos,
  activeFiltersCount,
}: ProcessosHeaderProps) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes-fechados"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_submissions")
        .select("id, nome_completo")
        .eq("estagio", "fechado")
        .order("nome_completo");
      return data || [];
    },
  });

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button size="sm" onClick={onNewProcesso} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Processo
      </Button>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou cliente..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.cliente_id || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, cliente_id: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os clientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os clientes</SelectItem>
          {clientes?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nome_completo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={onOpenFilters} className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Button variant="outline" size="sm" onClick={onViewPrazos} className="gap-2">
        <Calendar className="h-4 w-4" />
        Ver Prazos
      </Button>
    </div>
  );
}
