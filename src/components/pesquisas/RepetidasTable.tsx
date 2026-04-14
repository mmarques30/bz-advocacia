import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface ConsultaAgrupada {
  parametro: string;
  tipo: string;
  quantidade: number;
  ultimaConsulta: string;
}

interface RepetidasTableProps {
  consultas: ConsultaAgrupada[];
}

const tipoLabels: Record<string, string> = {
  veiculo: "Veículo",
  pessoa: "Pessoa",
  imovel: "Imóvel",
  certidao: "Certidão",
};

export function RepetidasTable({ consultas }: RepetidasTableProps) {
  const columns = useMemo<DataTableColumn<ConsultaAgrupada>[]>(
    () => [
      {
        id: "parametro",
        header: "Parâmetro",
        sortable: true,
        searchable: true,
        className: "font-mono text-sm",
        cell: (c) => c.parametro,
      },
      {
        id: "tipo",
        header: "Tipo",
        sortable: true,
        searchable: true,
        sortValue: (c) => tipoLabels[c.tipo] || c.tipo,
        cell: (c) => tipoLabels[c.tipo] || c.tipo,
      },
      {
        id: "quantidade",
        header: "Qtd. Pesquisas",
        sortable: true,
        className: "text-center",
        sortValue: (c) => c.quantidade,
        cell: (c) => (
          <div className="text-center">
            <Badge variant={c.quantidade > 3 ? "destructive" : "secondary"}>
              {c.quantidade}x
            </Badge>
          </div>
        ),
      },
      {
        id: "ultimaConsulta",
        header: "Última Consulta",
        sortable: true,
        sortValue: (c) => new Date(c.ultimaConsulta).getTime(),
        cell: (c) =>
          format(new Date(c.ultimaConsulta), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={consultas || []}
      columns={columns}
      rowKey={(c, i) => `${c.parametro}-${i}`}
      searchPlaceholder="Buscar por parâmetro ou tipo..."
      emptyMessage="Nenhuma consulta repetida encontrada"
      pageSize={25}
    />
  );
}
