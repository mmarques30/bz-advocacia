import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAcordoDetalhes } from "@/hooks/useFinanceiro";
import { useHistoricoPagamentosAcordo } from "@/hooks/useHistoricoPagamentos";
import { STATUS_ACORDO_LABELS, STATUS_PARCELA_LABELS, FORMA_PAGAMENTO_LABELS } from "@/types/financeiro";
import { DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AcordoDetailsDialogProps {
  acordoId: string | null;
  open: boolean;
  onClose: () => void;
  onRegistrarPagamento: (parcelaId: string) => void;
}

export function AcordoDetailsDialog({ acordoId, open, onClose, onRegistrarPagamento }: AcordoDetailsDialogProps) {
  const { data: acordo } = useAcordoDetalhes(acordoId);
  const { data: historico } = useHistoricoPagamentosAcordo(acordoId);

  if (!acordo) return null;

  const totalPago = acordo.parcelas?.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;
  const totalPendente = acordo.parcelas?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0) || 0;
  const totalAtrasado = acordo.parcelas?.filter(p => 
    p.status !== 'pago' && new Date(p.data_vencimento) < new Date()
  ).reduce((sum, p) => sum + p.valor, 0) || 0;

  const getStatusParcelaVariant = (parcela: any) => {
    if (parcela.status === 'pago') return 'secondary';
    if (new Date(parcela.data_vencimento) < new Date()) return 'destructive';
    return 'default';
  };

  const getStatusParcelaLabel = (parcela: any) => {
    if (parcela.status === 'pago') return `Pago em ${format(new Date(parcela.data_pagamento!), "dd/MM/yyyy")}`;
    const diasAtraso = differenceInDays(new Date(), new Date(parcela.data_vencimento));
    if (diasAtraso > 0) return `Atrasado há ${diasAtraso} dias`;
    return 'Pendente';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Acordo Financeiro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-semibold">{acordo.cliente?.nome_completo}</h3>
              <p className="text-sm text-muted-foreground">{acordo.tipo_servico}</p>
              {acordo.processo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Processo: {acordo.processo.numero_processo}
                </p>
              )}
            </div>
            <Badge variant={acordo.status === 'ativo' ? 'default' : acordo.status === 'concluido' ? 'secondary' : 'destructive'}>
              {STATUS_ACORDO_LABELS[acordo.status]}
            </Badge>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acordo.valor_total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parcelas</p>
              <p className="text-lg font-semibold">{acordo.numero_parcelas}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="text-lg font-semibold">{FORMA_PAGAMENTO_LABELS[acordo.forma_pagamento]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="text-lg font-semibold">
                {format(new Date(acordo.created_at), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          {/* Totalizadores */}
          <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Pago</p>
              <p className="text-lg font-semibold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Atrasado</p>
              <p className="text-lg font-semibold text-destructive">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAtrasado)}
              </p>
            </div>
          </div>

          {/* Tabela de Parcelas */}
          <div>
            <h4 className="font-semibold mb-3">Parcelas</h4>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acordo.parcelas?.map((parcela) => (
                    <TableRow key={parcela.id}>
                      <TableCell>{parcela.numero_parcela}</TableCell>
                      <TableCell>
                        {format(new Date(parcela.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusParcelaVariant(parcela)}>
                          {getStatusParcelaLabel(parcela)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {parcela.status !== 'pago' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRegistrarPagamento(parcela.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Registrar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          {historico && historico.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Histórico de Pagamentos</h4>
              <div className="space-y-2">
                {historico.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm font-medium">
                        Parcela {item.parcela?.numero_parcela}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.data_pagamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.forma_pagamento}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
