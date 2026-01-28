import { useClienteContratos } from "@/hooks/useClienteContratos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Eye, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_CONTRATO, TIPOS_CONTRATO } from "@/types/contratos";

interface LeadContratosTabProps {
  clienteId: string;
}

export function LeadContratosTab({ clienteId }: LeadContratosTabProps) {
  const { data: contratos, isLoading } = useClienteContratos(clienteId);

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'proposta') return 'Proposta';
    const tipoConfig = TIPOS_CONTRATO.find(t => t.value === tipo);
    return tipoConfig?.label || tipo;
  };

  const getStatusConfig = (status: string) => {
    const statusConfig = STATUS_CONTRATO.find(s => s.value === status);
    return statusConfig || { label: status, color: 'bg-muted text-muted-foreground' };
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contratos || contratos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum contrato ou proposta gerado para este cliente</p>
        <p className="text-sm mt-1">
          Acesse Vendas {">"} Documentos para gerar novos documentos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {contratos.length} documento(s) encontrado(s)
        </h3>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((contrato) => {
              const statusConfig = getStatusConfig(contrato.status);
              const valor = contrato.valores?.valor_total || contrato.valores?.valor_entrada;

              return (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {contrato.titulo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={contrato.tipo_contrato === 'proposta' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}>
                      {getTipoLabel(contrato.tipo_contrato)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(valor)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(contrato.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contrato.pdf_url && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="Baixar PDF"
                          onClick={() => window.open(contrato.pdf_url, '_blank')}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
