import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface DashboardFiltersProps {
  periodo: string;
  onPeriodoChange: (value: '7d' | '30d' | '90d') => void;
  onClearFilters: () => void;
}

export function DashboardFilters({ periodo, onPeriodoChange, onClearFilters }: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border mb-6">
      <div className="flex-1 min-w-[200px]">
        <Select value={periodo} onValueChange={(value) => onPeriodoChange(value as '7d' | '30d' | '90d')}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select defaultValue="todos">
          <SelectTrigger>
            <SelectValue placeholder="Tipo de processo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="inventario">Inventário</SelectItem>
            <SelectItem value="divorcio">Divórcio</SelectItem>
            <SelectItem value="planejamento">Planejamento Sucessório</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select defaultValue="todas">
          <SelectTrigger>
            <SelectValue placeholder="Origem do lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as origens</SelectItem>
            <SelectItem value="site">Site</SelectItem>
            <SelectItem value="indicacao">Indicação</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={onClearFilters}>
        <X className="h-4 w-4 mr-2" />
        Limpar
      </Button>
    </div>
  );
}
