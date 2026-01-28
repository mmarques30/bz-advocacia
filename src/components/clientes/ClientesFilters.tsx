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
import { ORIGEM_LABELS, TIPO_PROCESSO_OPTIONS, STATUS_CLIENTE_LABELS, StatusCliente } from "@/types/leads";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface ClientesFiltersType {
  search: string;
  origem: string[];
  tipoProcesso: string[];
  statusCliente: StatusCliente[];
  statusProcesso: string[];
}

interface ClientesFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: ClientesFiltersType;
  onFiltersChange: (filters: ClientesFiltersType) => void;
}

const STATUS_PROCESSO_OPTIONS = [
  { value: 'sem_processo', label: 'Sem Processo' },
  { value: 'em_andamento', label: 'Com Processo em Andamento' },
  { value: 'concluido', label: 'Todos Processos Concluídos' },
  { value: 'arquivado', label: 'Todos Processos Arquivados' },
];

export function ClientesFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: ClientesFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      search: filters.search,
      origem: [],
      tipoProcesso: [],
      statusCliente: [],
      statusProcesso: [],
    });
  };

  const handleStatusClienteToggle = (statusCliente: StatusCliente) => {
    const newStatusCliente = filters.statusCliente.includes(statusCliente)
      ? filters.statusCliente.filter((s) => s !== statusCliente)
      : [...filters.statusCliente, statusCliente];
    onFiltersChange({ ...filters, statusCliente: newStatusCliente });
  };

  const handleOrigemToggle = (origem: string) => {
    const newOrigem = filters.origem.includes(origem)
      ? filters.origem.filter((o) => o !== origem)
      : [...filters.origem, origem];
    onFiltersChange({ ...filters, origem: newOrigem });
  };

  const handleTipoProcessoToggle = (tipo: string) => {
    const newTipos = filters.tipoProcesso.includes(tipo)
      ? filters.tipoProcesso.filter((t) => t !== tipo)
      : [...filters.tipoProcesso, tipo];
    onFiltersChange({ ...filters, tipoProcesso: newTipos });
  };

  const handleStatusProcessoToggle = (status: string) => {
    const newStatus = filters.statusProcesso.includes(status)
      ? filters.statusProcesso.filter((s) => s !== status)
      : [...filters.statusProcesso, status];
    onFiltersChange({ ...filters, statusProcesso: newStatus });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filtros de Clientes</SheetTitle>
          <SheetDescription>
            Refine sua busca de clientes com filtros específicos
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-6">
          <div className="space-y-6">
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

            {/* Status dos Processos */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Status dos Processos</h3>
              <div className="space-y-2">
                {STATUS_PROCESSO_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-processo-${option.value}`}
                      checked={filters.statusProcesso.includes(option.value)}
                      onCheckedChange={() => handleStatusProcessoToggle(option.value)}
                    />
                    <Label htmlFor={`status-processo-${option.value}`} className="cursor-pointer">
                      {option.label}
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
                      checked={filters.origem.includes(key)}
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