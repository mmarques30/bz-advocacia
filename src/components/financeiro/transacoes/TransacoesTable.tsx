import { useState } from "react";
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
import { useTransacoes, useDeleteTransacao } from "@/hooks/useTransacoesFinanceiras";
import type { TransacoesFilters, TransacaoFinanceira } from "@/types/transacoes";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditTransacaoDialog } from "./EditTransacaoDialog";

interface Props {
  filters: TransacoesFilters;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
};

export function TransacoesTable({ filters }: Props) {
  const { data: transacoes, isLoading } = useTransacoes(filters);
  const deleteTransacao = useDeleteTransacao();
  
  const [editingTransacao, setEditingTransacao] = useState<TransacaoFinanceira | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const transacoesToShow = isExpanded 
    ? transacoes 
    : transacoes?.slice(0, 3);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteTransacao.mutateAsync(deletingId);
      toast.success("Transação excluída com sucesso");
      setDeletingId(null);
    } catch (error) {
      toast.error("Erro ao excluir transação");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const total = transacoes?.reduce((sum, t) => {
    if (t.tipo_codigo === "receita") return sum + Number(t.valor);
    return sum - Number(t.valor);
  }, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {transacoes?.length || 0} transações encontradas
        </p>
        <p className="text-sm font-medium">
          Saldo filtrado:{" "}
          <span className={total >= 0 ? "text-emerald-600" : "text-red-600"}>
            {formatCurrency(total)}
          </span>
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoesToShow?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              transacoesToShow?.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell className="font-medium">
                    {formatDate(transacao.data_transacao)}
                  </TableCell>
                  <TableCell>{transacao.descricao || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transacao.tipo_codigo === "receita" ? "default" : "destructive"}
                      className={
                        transacao.tipo_codigo === "receita"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {transacao.tipo_codigo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {transacao.categoria_codigo === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transacao.subcategoria_codigo}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transacao.tipo_codigo === "receita"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {transacao.tipo_codigo === "receita" ? "+" : "-"}
                    {formatCurrency(Number(transacao.valor))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTransacao(transacao)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingId(transacao.id)}
                          className="text-destructive focus:text-destructive"
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

      {transacoes && transacoes.length > 3 && (
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver todas as {transacoes.length} transações
              </>
            )}
          </Button>
        </div>
      )}

      <EditTransacaoDialog
        open={!!editingTransacao}
        onClose={() => setEditingTransacao(null)}
        transacao={editingTransacao}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
