import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAcordoDetalhes } from "@/hooks/useFinanceiro";
import { useHistoricoPagamentosAcordo } from "@/hooks/useHistoricoPagamentos";
import { useDesfazerPagamento } from "@/hooks/useParcelas";
import { STATUS_ACORDO_LABELS, FORMA_PAGAMENTO_LABELS } from "@/types/financeiro";
import { DollarSign, MoreHorizontal, Undo2, Pencil } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditParcelaValorDialog } from "./EditParcelaValorDialog";

interface AcordoDetailsDialogProps {
  acordoId: string | null;
  open: boolean;
  onClose: () => void;
  onRegistrarPagamento: (parcelaId: string) => void;
}

type StatusFilter = "todas" | "a_receber" | "recebidas" | "atrasadas";

export function AcordoDetailsDialog({ acordoId, open, onClose, onRegistrarPagamento }: AcordoDetailsDialogProps) {
  const { data: acordo } = useAcordoDetalhes(acordoId);
  const { data: historico } = useHistoricoPagamentosAcordo(acordoId);
  const desfazerPagamento = useDesfazerPagamento();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [editParcela, setEditParcela] = useState<{ id: string; valor: number; numero_parcela: number } | null>(null);
  const [desfazerParcelaId, setDesfazerParcelaId] = useState<string | null>(null);

  if (!acordo) return null;

  const parcelas = acordo.parcelas || [];
  const now = new Date();

  const counts = {
    todas: parcelas.length,
    a_receber: parcelas.filter(p => p.status === "pendente" && new Date(p.data_vencimento) >= now).length,
    recebidas: parcelas.filter(p => p.status === "pago").length,
    atrasadas: parcelas.filter(p => p.status !== "pago" && new Date(p.data_vencimento) < now).length,
  };

  const parcelasFiltradas = parcelas.filter(p => {
    if (statusFilter === "recebidas") return p.status === "pago";
    if (statusFilter === "a_receber") return p.status === "pendente" && new Date(p.data_vencimento) >= now;
    if (statusFilter === "atrasadas") return p.status !== "pago" && new Date(p.data_vencimento) < now;
    return true;
  });

  const totalPago = parcelas.filter(p => p.status === "pago").reduce((sum, p) => sum + (p.valor_pago || 0), 0);
  const totalPendente = parcelas.filter(p => p.status === "pendente").reduce((sum, p) => sum + p.valor, 0);
  const totalAtrasado = parcelas.filter(p => p.status !== "pago" && new Date(p.data_vencimento) < now).reduce((sum, p) => sum + p.valor, 0);

  const getStatusParcelaVariant = (parcela: any) => {
    if (parcela.status === "pago") return "secondary" as const;
    if (new Date(parcela.data_vencimento) < now) return "destructive" as const;
    return "default" as const;
  };

  const getStatusParcelaLabel = (parcela: any) => {
    if (parcela.status === "pago") return `Pago em ${format(new Date(parcela.data_pagamento!), "dd/MM/yyyy")}`;
    const diasAtraso = differenceInDays(now, new Date(parcela.data_vencimento));
    if (diasAtraso > 0) return `Atrasado há ${diasAtraso} dias`;
    return "Pendente";
  };

  const handleDesfazer = () => {
    if (!desfazerParcelaId) return;
    desfazerPagamento.mutate(desfazerParcelaId, {
      onSuccess: () => setDesfazerParcelaId(null),
    });
  };

  const filterLabels: Record<StatusFilter, string> = {
    todas: "Todas",
    a_receber: "A Receber",
    recebidas: "Recebidas",
    atrasadas: "Atrasadas",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato Financeiro</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold">{acordo.cliente?.nome_completo}</h3>
                <p className="text-sm text-muted-foreground">{acordo.tipo_servico}</p>
                {acordo.processo && (
                  <p className="text-xs text-muted-foreground mt-1">Processo: {acordo.processo.numero_processo}</p>
                )}
              </div>
              <Badge variant={acordo.status === "ativo" ? "default" : acordo.status === "concluido" ? "secondary" : "destructive"}>
                {STATUS_ACORDO_LABELS[acordo.status]}
              </Badge>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(acordo.valor_total)}
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
                <p className="text-lg font-semibold">{format(new Date(acordo.created_at), "dd/MM/yyyy")}</p>
              </div>
            </div>

            {/* Totalizadores */}
            <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-lg font-semibold text-green-600">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPago)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPendente)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Atrasado</p>
                <p className="text-lg font-semibold text-destructive">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAtrasado)}
                </p>
              </div>
            </div>

            {/* Filtro + Tabela de Parcelas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Parcelas</h4>
                <ToggleGroup
                  type="single"
                  value={statusFilter}
                  onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
                  size="sm"
                  variant="outline"
                >
                  {(Object.keys(filterLabels) as StatusFilter[]).map((key) => (
                    <ToggleGroupItem key={key} value={key} className="text-xs">
                      {filterLabels[key]} ({counts[key]})
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
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
                    {parcelasFiltradas.map((parcela) => (
                      <TableRow key={parcela.id}>
                        <TableCell>{parcela.numero_parcela}</TableCell>
                        <TableCell>{format(new Date(parcela.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parcela.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusParcelaVariant(parcela)}>{getStatusParcelaLabel(parcela)}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {parcela.status !== "pago" && (
                                <DropdownMenuItem onClick={() => onRegistrarPagamento(parcela.id)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Registrar Pagamento
                                </DropdownMenuItem>
                              )}
                              {parcela.status === "pago" && (
                                <DropdownMenuItem onClick={() => setDesfazerParcelaId(parcela.id)}>
                                  <Undo2 className="h-4 w-4 mr-2" />
                                  Desfazer Pagamento
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setEditParcela({ id: parcela.id, valor: parcela.valor, numero_parcela: parcela.numero_parcela })}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar Valor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                        <p className="text-sm font-medium">Parcela {item.parcela?.numero_parcela}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.data_pagamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valor)}
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

      {/* Edit Value Dialog */}
      <EditParcelaValorDialog parcela={editParcela} open={!!editParcela} onClose={() => setEditParcela(null)} />

      {/* Confirm Undo Payment */}
      <AlertDialog open={!!desfazerParcelaId} onOpenChange={() => setDesfazerParcelaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              A parcela voltará para o status "Pendente" e o registro de pagamento será removido do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesfazer} disabled={desfazerPagamento.isPending}>
              {desfazerPagamento.isPending ? "Desfazendo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
