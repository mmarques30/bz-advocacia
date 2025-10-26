import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, DollarSign } from "lucide-react";
import { useAcordos } from "@/hooks/useFinanceiro";
import { STATUS_ACORDO_LABELS } from "@/types/financeiro";
import type { AcordosFilters } from "@/types/financeiro";

interface AcordosTableProps {
  filters: AcordosFilters;
  onSelectAcordo: (acordoId: string) => void;
  onRegistrarPagamento: (parcelaId: string) => void;
}

export function AcordosTable({ filters, onSelectAcordo, onRegistrarPagamento }: AcordosTableProps) {
  const { data: acordos, isLoading } = useAcordos(filters);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'concluido':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPossuiAtraso = (acordo: any) => {
    return acordo.parcelas?.some((p: any) => 
      p.status !== 'pago' && new Date(p.data_vencimento) < new Date()
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando acordos...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Parcelas Pagas</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {acordos?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum acordo encontrado
              </TableCell>
            </TableRow>
          ) : (
            acordos?.map((acordo) => {
              const parcelasPagas = acordo.parcelas?.filter(p => p.status === 'pago').length || 0;
              const totalPago = acordo.parcelas?.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;
              const saldo = acordo.valor_total - totalPago;
              const possuiAtraso = getPossuiAtraso(acordo);

              return (
                <TableRow key={acordo.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{acordo.cliente?.nome_completo || "Cliente"}</p>
                      {possuiAtraso && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Em atraso
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{acordo.tipo_servico}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acordo.valor_total)}
                  </TableCell>
                  <TableCell>
                    {parcelasPagas}/{acordo.numero_parcelas}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(acordo.status)}>
                      {STATUS_ACORDO_LABELS[acordo.status as keyof typeof STATUS_ACORDO_LABELS]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectAcordo(acordo.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const proximaParcela = acordo.parcelas?.find(p => p.status === 'pendente');
                            if (proximaParcela) {
                              onRegistrarPagamento(proximaParcela.id);
                            }
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Registrar Pagamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
