import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { usePagamentosCliente } from "@/hooks/useRelatoriosCliente";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF } from "@/lib/exportUtils";

interface RelatorioHistoricoPagamentosProps {
  clienteId: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export function RelatorioHistoricoPagamentos({
  clienteId,
  dataInicio,
  dataFim,
}: RelatorioHistoricoPagamentosProps) {
  const { data: pagamentos, isLoading } = usePagamentosCliente(clienteId, dataInicio, dataFim);

  const totalPago = pagamentos?.reduce((sum, pag) => sum + Number(pag.valor), 0) || 0;

  const handleExportPDF = () => {
    exportToPDF(pagamentos, "Histórico de Pagamentos");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Pagamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pagamentos?.length || 0} pagamento(s) registrado(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Pago</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalPago)}
            </div>
          </CardContent>
        </Card>
      </div>

      {!pagamentos || pagamentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum pagamento registrado no período selecionado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Tipo de Serviço</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.map((pagamento: any) => (
              <TableRow key={pagamento.id}>
                <TableCell>
                  {format(new Date(pagamento.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  Parcela {pagamento.parcela?.numero_parcela || "N/A"}
                </TableCell>
                <TableCell>
                  {pagamento.parcela?.acordo?.tipo_servico || "N/A"}
                </TableCell>
                <TableCell>{pagamento.forma_pagamento}</TableCell>
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(pagamento.valor))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
