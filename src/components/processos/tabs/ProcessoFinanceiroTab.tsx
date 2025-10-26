import { Processo } from "@/types/processos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ProcessoFinanceiroTabProps {
  processo: Processo;
}

export function ProcessoFinanceiroTab({ processo }: ProcessoFinanceiroTabProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade será implementada futuramente para vincular processos ao módulo financeiro.
        </AlertDescription>
      </Alert>

      {processo.valor && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Valor do Processo</h4>
          <p className="text-2xl font-bold">
            R$ {processo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {processo.cliente && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Cliente Vinculado</h4>
          <p className="text-sm">{processo.cliente.nome_completo}</p>
          <p className="text-xs text-muted-foreground">{processo.cliente.email}</p>
        </div>
      )}
    </div>
  );
}
