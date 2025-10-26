import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TipoRelatorio } from "@/types/financeiro";

interface RelatorioSelectorProps {
  tipoRelatorio: TipoRelatorio | null;
  setTipoRelatorio: (tipo: TipoRelatorio | null) => void;
  dataInicio: Date;
  setDataInicio: (data: Date) => void;
  dataFim: Date;
  setDataFim: (data: Date) => void;
  onGerar: () => void;
}

export function RelatorioSelector({
  tipoRelatorio,
  setTipoRelatorio,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  onGerar,
}: RelatorioSelectorProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select
              value={tipoRelatorio || ""}
              onValueChange={(value) => setTipoRelatorio(value as TipoRelatorio)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receitas_periodo">Receitas do Período</SelectItem>
                <SelectItem value="inadimplencia_detalhada">Inadimplência</SelectItem>
                <SelectItem value="fluxo_caixa_projetado">Fluxo de Caixa</SelectItem>
                <SelectItem value="performance_tipo_processo">Performance por Tipo</SelectItem>
                <SelectItem value="performance_cliente">Performance por Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Data Início</Label>
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
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => date && setDataInicio(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Data Fim</Label>
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
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={(date) => date && setDataFim(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={onGerar} disabled={!tipoRelatorio} className="w-full md:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
