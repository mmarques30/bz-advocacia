import { useState } from "react";
import { Card } from "@/components/ui/card";
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb";
import { RelatorioClienteCompleto } from "@/components/leads/relatorios/RelatorioClienteCompleto";
import { useClientes } from "@/hooks/useRelatoriosCliente";
import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RelatoriosCliente() {
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const { data: clientes, isLoading } = useClientes();

  return (
    <div className="space-y-6">
      <div>
        <DynamicBreadcrumb />
        <h1 className="text-3xl font-seasons font-bold text-foreground mt-4">
          Relatório Clientes
        </h1>
        <p className="text-muted-foreground mt-2">
          Selecione um cliente para visualizar o relatório completo automaticamente
        </p>
      </div>

      {/* Seletor de Cliente Simplificado */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <label className="text-sm font-medium mb-2 block">Cliente</label>
            <Select
              value={clienteSelecionado || ""}
              onValueChange={(value) => setClienteSelecionado(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente para gerar o relatório" />
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
        </div>
      </Card>

      {/* Relatório Automático */}
      {clienteSelecionado && (
        <Card className="p-6">
          <RelatorioClienteCompleto clienteId={clienteSelecionado} />
        </Card>
      )}

      {/* Estado vazio */}
      {!clienteSelecionado && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Selecione um cliente para visualizar o relatório completo
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              O relatório inclui dados do cliente, situação financeira, andamentos recentes, próximos vencimentos e status dos processos
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
