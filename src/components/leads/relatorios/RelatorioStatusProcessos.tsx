import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProcessosCliente } from "@/hooks/useRelatoriosCliente";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF } from "@/lib/exportUtils";

interface RelatorioStatusProcessosProps {
  clienteId: string;
}

export function RelatorioStatusProcessos({ clienteId }: RelatorioStatusProcessosProps) {
  const { data: processos, isLoading } = useProcessosCliente(clienteId);

  const handleExportPDF = () => {
    exportToPDF(processos, "Status dos Processos");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!processos || processos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum processo encontrado para este cliente
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Status dos Processos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total de {processos.length} processo(s)
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número do Processo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Responsável</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.map((processo) => (
            <TableRow key={processo.id}>
              <TableCell className="font-medium">
                {processo.numero_processo || "N/A"}
              </TableCell>
              <TableCell>{processo.tipo}</TableCell>
              <TableCell>
                <Badge variant={processo.status === "ativo" ? "default" : "secondary"}>
                  {processo.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(processo.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                N/A
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
