import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { RelatorioStatusProcessos } from "./RelatorioStatusProcessos";
import { RelatorioHistoricoPagamentos } from "./RelatorioHistoricoPagamentos";
import { RelatorioProximosVencimentos } from "./RelatorioProximosVencimentos";
import { RelatorioAndamentosRecentes } from "./RelatorioAndamentosRecentes";

interface RelatorioResumoCompletoProps {
  clienteId: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export function RelatorioResumoCompleto({
  clienteId,
  dataInicio,
  dataFim,
}: RelatorioResumoCompletoProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resumo Completo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Relatório executivo com todas as informações do cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm">
            <LinkIcon className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <RelatorioStatusProcessos clienteId={clienteId} />
        </div>

        <Separator />

        <div>
          <RelatorioHistoricoPagamentos
            clienteId={clienteId}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </div>

        <Separator />

        <div>
          <RelatorioProximosVencimentos clienteId={clienteId} />
        </div>

        <Separator />

        <div>
          <RelatorioAndamentosRecentes clienteId={clienteId} />
        </div>
      </div>
    </div>
  );
}
