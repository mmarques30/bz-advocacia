import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { MoreHorizontal, Trash2, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { useTransacoes, useDeleteTransacao } from "@/hooks/useTransacoesFinanceiras";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import type { HistoricoFiltersState } from "./HistoricoFilters";
import { format } from "date-fns";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import type { TransacaoFinanceira } from "@/types/transacoes";

interface Props {
  filters: HistoricoFiltersState;
  mode?: "preview" | "full";
}

const PAGE_SIZE_FULL = 20;
const PREVIEW_LIMIT = 3;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function HistoricoTable({ filters, mode = "full" }: Props) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: transacoes, isLoading, error } = useTransacoes({
    anos: filters.ano ? [filters.ano] : undefined,
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
    } catch (_error) {
      toast.error("Erro ao excluir transação");
    }
  };

  const columns = useMemo<DataTableColumn<TransacaoFinanceira>[]>(
    () => [
      {
        id: "data_transacao",
        header: "Data",
        sortable: true,
        sortValue: (t) => (t.data_transacao ? new Date(t.data_transacao).getTime() : 0),
        cell: (t) =>
          t.data_transacao ? format(new Date(t.data_transacao), "dd/MM/yyyy") : "-",
      },
      {
        id: "tipo_codigo",
        header: "Tipo",
        sortable: true,
        searchable: true,
        cell: (t) => (
          <Badge
            variant={t.tipo_codigo === "receita" ? "default" : "destructive"}
            className={t.tipo_codigo === "receita" ? "bg-emerald-600" : ""}
          >
            {t.tipo_codigo === "receita" ? "Receita" : "Despesa"}
          </Badge>
        ),
      },
      {
        id: "categoria_codigo",
        header: "Categoria",
        sortable: true,
        searchable: true,
        cell: (t) => (
          <Badge variant="outline">
            {t.categoria_codigo?.toUpperCase() || "-"}
          </Badge>
        ),
      },
      {
        id: "descricao",
        header: "Descrição",
        sortable: true,
        searchable: true,
        className: "max-w-[250px]",
        cell: (t) => (
          <span className="block truncate" title={t.descricao || undefined}>
            {t.descricao || "-"}
          </span>
        ),
      },
      {
        id: "mes_ano",
        header: "Mês/Ano",
        sortable: true,
        sortValue: (t) => t.ano * 100 + t.mes,
        cell: (t) => `${t.mes_nome} / ${t.ano}`,
      },
      {
        id: "valor",
        header: "Valor",
        sortable: true,
        className: "text-right",
        sortValue: (t) => Number(t.valor),
        cell: (t) => (
          <div className="text-right font-medium">
            <span
              className={
                t.tipo_codigo === "receita" ? "text-emerald-600" : "text-destructive"
              }
            >
              {brl.format(Number(t.valor))}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (t) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDeleteId(t.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
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

  const totalReceitas = filteredTransacoes
    .filter((t) => t.tipo_codigo === "receita")
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalDespesas = filteredTransacoes
    .filter((t) => t.tipo_codigo === "despesa")
    .reduce((sum, t) => sum + Number(t.valor), 0);

  // Preview mode: mostra so as 3 primeiras sem paginacao nem busca,
  // e abaixo o botao para abrir a visao completa (mantem UX atual).
  const dataToShow =
    mode === "preview" ? filteredTransacoes.slice(0, PREVIEW_LIMIT) : filteredTransacoes;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredTransacoes.length} transações encontradas</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            Receitas: {brl.format(totalReceitas)}
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <TrendingDown className="h-4 w-4" />
            Despesas: {brl.format(totalDespesas)}
          </span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={dataToShow}
        columns={columns}
        rowKey={(t) => t.id}
        // Preview mode suprime busca e paginacao; a tela completa liga tudo.
        searchPlaceholder={mode === "preview" ? null : "Buscar por tipo, categoria ou descrição..."}
        pageSize={mode === "preview" ? 0 : PAGE_SIZE_FULL}
        emptyMessage="Nenhuma transação encontrada"
      />

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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
