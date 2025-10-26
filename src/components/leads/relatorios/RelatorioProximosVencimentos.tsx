import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useVencimentosCliente } from "@/hooks/useRelatoriosCliente";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF } from "@/lib/exportUtils";

interface RelatorioProximosVencimentosProps {
  clienteId: string;
}

export function RelatorioProximosVencimentos({ clienteId }: RelatorioProximosVencimentosProps) {
  const { data: vencimentos, isLoading } = useVencimentosCliente(clienteId);

  const totalAVencer = vencimentos?.reduce((sum, v) => sum + Number(v.valor), 0) || 0;

  const handleExportPDF = () => {
    exportToPDF(vencimentos, "Próximos Vencimentos");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Próximos Vencimentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {vencimentos?.length || 0} parcela(s) pendente(s)
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

      {!vencimentos || vencimentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum vencimento pendente
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Tipo de Serviço</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vencimentos.map((vencimento: any) => {
              const diasRestantes = differenceInDays(
                new Date(vencimento.data_vencimento),
                new Date()
              );
              
              return (
                <TableRow key={vencimento.id}>
                  <TableCell>Parcela {vencimento.numero_parcela}</TableCell>
                  <TableCell>{vencimento.acordo?.tipo_servico || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(vencimento.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={diasRestantes <= 7 ? "destructive" : "secondary"}>
                      {diasRestantes <= 0 ? "Vence hoje" : `${diasRestantes} dias`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(vencimento.valor))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
