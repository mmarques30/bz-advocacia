import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodoRelatorio } from "@/hooks/useRelatoriosVendas";

interface RelatorioFiltersProps {
  periodo: PeriodoRelatorio;
  onPeriodoChange: (periodo: PeriodoRelatorio) => void;
}

export function RelatorioFilters({ periodo, onPeriodoChange }: RelatorioFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={periodo} onValueChange={(value) => onPeriodoChange(value as PeriodoRelatorio)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
