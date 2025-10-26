import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientes } from "@/hooks/useRelatoriosCliente";
import { cn } from "@/lib/utils";

interface RelatorioClienteSelectorProps {
  clienteSelecionado: string | null;
  onClienteChange: (clienteId: string | null) => void;
  dataInicio?: Date;
  dataFim?: Date;
  onDataInicioChange: (date: Date | undefined) => void;
  onDataFimChange: (date: Date | undefined) => void;
}

export function RelatorioClienteSelector({
  clienteSelecionado,
  onClienteChange,
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
}: RelatorioClienteSelectorProps) {
  const { data: clientes, isLoading } = useClientes();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Cliente</label>
        <Select
          value={clienteSelecionado || ""}
          onValueChange={(value) => onClienteChange(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : clientes && clientes.length > 0 ? (
              clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome_completo}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                Nenhum cliente encontrado
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Data Início (Opcional)</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dataInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataInicio ? format(dataInicio, "PPP", { locale: ptBR }) : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dataInicio}
              onSelect={onDataInicioChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Data Fim (Opcional)</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dataFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataFim ? format(dataFim, "PPP", { locale: ptBR }) : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dataFim}
              onSelect={onDataFimChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
