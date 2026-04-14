import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelPerformance } from "@/types/analytics";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface ChannelComparisonTableProps {
  data?: ChannelPerformance[];
  loading?: boolean;
}

export function ChannelComparisonTable({ data, loading }: ChannelComparisonTableProps) {
  // Pre-ordena por melhor conversao DESC (mesmo default da versao anterior).
  // DataTable respeita a ordem recebida ate o usuario clicar em um cabecalho.
  const sortedData = useMemo(
    () => [...(data || [])].sort((a, b) => b.taxaConversao - a.taxaConversao),
    [data],
  );

  const columns = useMemo<DataTableColumn<ChannelPerformance>[]>(
    () => [
      {
        id: "origem",
        header: "Canal",
        sortable: true,
        searchable: true,
        sortValue: (c) => c.origem,
        cell: (c) => <span className="font-medium capitalize">{c.origem}</span>,
      },
      {
        id: "totalLeads",
        header: "Leads",
        sortable: true,
        className: "text-right",
        sortValue: (c) => c.totalLeads,
        cell: (c) => <div className="text-right">{c.totalLeads}</div>,
      },
      {
        id: "taxaConversao",
        header: "Conversão (%)",
        sortable: true,
        className: "text-right",
        sortValue: (c) => c.taxaConversao,
        cell: (c) => (
          <div className="text-right font-semibold">{c.taxaConversao.toFixed(1)}%</div>
        ),
      },
      {
        id: "ticketMedio",
        header: "Ticket Médio",
        sortable: true,
        className: "text-right",
        sortValue: (c) => c.ticketMedio,
        cell: (c) => (
          <div className="text-right">
            R$ {c.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        id: "tempoMedioConversao",
        header: "Tempo Médio",
        sortable: true,
        className: "text-right",
        sortValue: (c) => c.tempoMedioConversao,
        cell: (c) => (
          <div className="text-right">{Math.round(c.tempoMedioConversao)} dias</div>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Canais</CardTitle>
        <CardDescription>
          Ordenado por melhor conversão (clique nos cabeçalhos para reordenar)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={sortedData}
          columns={columns}
          rowKey={(c) => c.origem}
          // Esta tabela tipicamente tem &lt; 20 linhas (1 por canal), entao
          // nao precisa de paginacao nem busca. Passamos searchPlaceholder=null
          // para suprimir o input de busca, e pageSize=0 para desligar a
          // paginacao client-side.
          searchPlaceholder={null}
          pageSize={0}
          emptyMessage="Sem dados de canais no periodo"
        />
      </CardContent>
    </Card>
  );
}
