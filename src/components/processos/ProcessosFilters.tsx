import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROCESSO_STATUS_LABELS, TRIBUNAIS_OPCOES, ProcessosFilters as FiltersType, ProcessoStatus } from "@/types/processos";

interface ProcessosFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: FiltersType;
  onApply: (filters: FiltersType) => void;
}

export function ProcessosFilters({
  open,
  onClose,
  filters,
  onApply,
}: ProcessosFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FiltersType = { status: ["em_andamento"] };
    setLocalFilters(cleared);
    onApply(cleared);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status */}
          <div>
            <Label className="text-base font-semibold">Status</Label>
            <div className="space-y-2 mt-3">
              {Object.entries(PROCESSO_STATUS_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={localFilters.status.includes(value as ProcessoStatus)}
                    onCheckedChange={(checked) => {
                      setLocalFilters({
                        ...localFilters,
                        status: checked
                          ? [...localFilters.status, value as ProcessoStatus]
                          : localFilters.status.filter((s) => s !== value),
                      });
                    }}
                  />
                  <Label htmlFor={`status-${value}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tribunal */}
          <div>
            <Label htmlFor="tribunal">Tribunal</Label>
            <Select
              value={localFilters.tribunal || ""}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, tribunal: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {TRIBUNAIS_OPCOES.map((tribunal) => (
                  <SelectItem key={tribunal} value={tribunal}>
                    {tribunal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Processo */}
          <div>
            <Label htmlFor="tipo">Tipo de Processo</Label>
            <Input
              id="tipo"
              placeholder="Ex: Divórcio, Inventário..."
              value={localFilters.tipo || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, tipo: e.target.value || undefined })
              }
            />
          </div>

          {/* Tem prazo próximo */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prazo-proximo"
              checked={localFilters.tem_prazo_proximo || false}
              onCheckedChange={(checked) =>
                setLocalFilters({ ...localFilters, tem_prazo_proximo: checked as boolean })
              }
            />
            <Label htmlFor="prazo-proximo" className="font-normal cursor-pointer">
              Tem prazo próximo (&lt; 7 dias)
            </Label>
          </div>

          {/* Sem atualização há X dias */}
          <div>
            <Label htmlFor="sem-atualizacao">Sem atualização há (dias)</Label>
            <Input
              id="sem-atualizacao"
              type="number"
              placeholder="Ex: 30"
              value={localFilters.sem_atualizacao_dias || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sem_atualizacao_dias: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
