import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransacoes } from "@/hooks/useTransacoesFinanceiras";
import type { TransacoesFilters } from "@/types/transacoes";
import { Skeleton } from "@/components/ui/skeleton";

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              transacoes?.map((transacao) => (
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
