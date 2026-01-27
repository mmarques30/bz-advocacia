import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LeadsFilters as FiltersType, LEAD_STATUS_LABELS, ORIGEM_LABELS, TIPO_PROCESSO_OPTIONS, STATUS_CLIENTE_LABELS, StatusCliente } from "@/types/leads";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LeadsFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function LeadsFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: LeadsFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      search: filters.search,
      status: [],
      origem: [],
      tipoProcesso: [],
      dateRange: { start: null, end: null },
      diasParado: { min: 0, max: null },
      responsavel: null,
      statusCliente: [],
    });
  };

  const handleStatusClienteToggle = (statusCliente: StatusCliente) => {
    const newStatusCliente = filters.statusCliente.includes(statusCliente)
      ? filters.statusCliente.filter((s) => s !== statusCliente)
      : [...filters.statusCliente, statusCliente];
    onFiltersChange({ ...filters, statusCliente: newStatusCliente });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status as any)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status as any];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleOrigemToggle = (origem: string) => {
    const newOrigem = filters.origem.includes(origem as any)
      ? filters.origem.filter((o) => o !== origem)
      : [...filters.origem, origem as any];
    onFiltersChange({ ...filters, origem: newOrigem });
  };

  const handleTipoProcessoToggle = (tipo: string) => {
    const newTipos = filters.tipoProcesso.includes(tipo)
      ? filters.tipoProcesso.filter((t) => t !== tipo)
      : [...filters.tipoProcesso, tipo];
    onFiltersChange({ ...filters, tipoProcesso: newTipos });
  };

  const handleDiasParadoChange = (value: string) => {
    const ranges: Record<string, { min: number; max: number | null }> = {
      '0-3': { min: 0, max: 3 },
      '4-7': { min: 4, max: 7 },
      '7+': { min: 7, max: null },
      'all': { min: 0, max: null },
    };
    onFiltersChange({ ...filters, diasParado: ranges[value] });
  };

  const getCurrentDiasParadoValue = () => {
    const { min, max } = filters.diasParado;
    if (min === 0 && max === 3) return '0-3';
    if (min === 4 && max === 7) return '4-7';
    if (min === 7 && max === null) return '7+';
    return 'all';
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Refine sua busca de leads com filtros específicos
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-6">
          <div className="space-y-6">
            {/* Status/Estágio */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Status/Estágio</h3>
              <div className="space-y-2">
                {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${key}`}
                      checked={filters.status.includes(key as any)}
                      onCheckedChange={() => handleStatusToggle(key)}
                    />
                    <Label htmlFor={`status-${key}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Origem */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Origem</h3>
              <div className="space-y-2">
                {Object.entries(ORIGEM_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`origem-${key}`}
                      checked={filters.origem.includes(key as any)}
                      onCheckedChange={() => handleOrigemToggle(key)}
                    />
                    <Label htmlFor={`origem-${key}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tipo de Processo */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Tipo de Processo</h3>
              <div className="space-y-2">
                {TIPO_PROCESSO_OPTIONS.map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tipo-${tipo}`}
                      checked={filters.tipoProcesso.includes(tipo)}
                      onCheckedChange={() => handleTipoProcessoToggle(tipo)}
                    />
                    <Label htmlFor={`tipo-${tipo}`} className="cursor-pointer">
                      {tipo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Situação do Cliente */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Situação do Cliente</h3>
              <div className="space-y-2">
                {Object.entries(STATUS_CLIENTE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-cliente-${key}`}
                      checked={filters.statusCliente.includes(key as StatusCliente)}
                      onCheckedChange={() => handleStatusClienteToggle(key as StatusCliente)}
                    />
                    <Label htmlFor={`status-cliente-${key}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tempo Parado */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Tempo Parado</h3>
              <RadioGroup value={getCurrentDiasParadoValue()} onValueChange={handleDiasParadoChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="dias-all" />
                  <Label htmlFor="dias-all" className="cursor-pointer">
                    Todos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-3" id="dias-0-3" />
                  <Label htmlFor="dias-0-3" className="cursor-pointer">
                    0-3 dias
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4-7" id="dias-4-7" />
                  <Label htmlFor="dias-4-7" className="cursor-pointer">
                    4-7 dias
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7+" id="dias-7plus" />
                  <Label htmlFor="dias-7plus" className="cursor-pointer">
                    7+ dias
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
          <Button onClick={onClose}>Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
