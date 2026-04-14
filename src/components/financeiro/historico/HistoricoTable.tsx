import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useTransacoes, useDeleteTransacao } from "@/hooks/useTransacoesFinanceiras";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import type { HistoricoFiltersState } from "./HistoricoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  filters: HistoricoFiltersState;
  mode?: "preview" | "full";
}

const ITEMS_PER_PAGE = 20;
const PREVIEW_LIMIT = 3;

export function HistoricoTable({ filters, mode = "full" }: Props) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: transacoes, isLoading, error } = useTransacoes({
    anos: filters.ano ? [filters.ano] : undefined, // Converte ano único para array
    dataInicio: filters.dataInicio || undefined,
    dataFim: filters.dataFim || undefined,
    tipo_codigo: filters.tipo || undefined,
    categoria_codigo: filters.categoria || undefined,
  });

  const deleteTransacao = useDeleteTransacao();

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteTransacao.mutateAsync(deleteId);
      toast.success("Transação excluída com sucesso");
      setDeleteId(null);
    } catch (error) {
      toast.error("Erro ao excluir transação");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Erro ao carregar transações: {(error as Error).message}
      </div>
    );
  }

  const filteredTransacoes = transacoes || [];
  const totalPages = Math.ceil(filteredTransacoes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransacoes = filteredTransacoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  // For preview mode, show only first 3 items
  const displayedTransacoes = mode === "preview" 
    ? filteredTransacoes.slice(0, PREVIEW_LIMIT)
    : paginatedTransacoes;

  const totalReceitas = filteredTransacoes
    .filter(t => t.tipo_codigo === "receita")
    .reduce((sum, t) => sum + Number(t.valor), 0);
  
  const totalDespesas = filteredTransacoes
    .filter(t => t.tipo_codigo === "despesa")
    .reduce((sum, t) => sum + Number(t.valor), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredTransacoes.length} transações encontradas</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            Receitas: {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <TrendingDown className="h-4 w-4" />
            Despesas: {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Mês/Ano</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              displayedTransacoes.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell>
                    {transacao.data_transacao
                      ? format(new Date(transacao.data_transacao), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={transacao.tipo_codigo === "receita" ? "default" : "destructive"}
                      className={transacao.tipo_codigo === "receita" ? "bg-emerald-600" : ""}
                    >
                      {transacao.tipo_codigo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {transacao.categoria_codigo?.toUpperCase() || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {transacao.descricao || "-"}
                  </TableCell>
                  <TableCell>
                    {transacao.mes_nome} / {transacao.ano}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transacao.tipo_codigo === "receita" ? "text-emerald-600" : "text-destructive"}>
                      {Number(transacao.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeleteId(transacao.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview mode: Show "Ver todas" button */}
      {mode === "preview" && filteredTransacoes.length > PREVIEW_LIMIT && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/dashboard/financeiro/historico")}
        >
          Ver todas as {filteredTransacoes.length} transações
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      )}

      {/* Pagination - only in full mode */}
      {mode === "full" && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
