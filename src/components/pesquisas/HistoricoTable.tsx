import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import type { ConsultaRealizada } from "@/types/pesquisas";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface HistoricoTableProps {
  consultas: ConsultaRealizada[];
  onVisualizarResultado?: (consulta: ConsultaRealizada) => void;
  onExportar?: (consulta: ConsultaRealizada) => void;
}

const tipoLabels: Record<string, string> = {
  processo: "Processo",
  cpf: "Pessoa (CPF)",
  cnpj: "Empresa (CNPJ)",
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  sucesso: { label: "Sucesso", variant: "default" },
  erro: { label: "Erro", variant: "destructive" },
  sem_dados: { label: "Sem dados", variant: "secondary" },
  api_nao_configurada: { label: "API não configurada", variant: "outline" },
};

export function HistoricoTable({
  consultas,
  onVisualizarResultado,
  onExportar,
}: HistoricoTableProps) {
  const columns = useMemo<DataTableColumn<ConsultaRealizada>[]>(
    () => [
      {
        id: "created_at",
        header: "Data/Hora",
        sortable: true,
        sortValue: (c) => new Date(c.created_at).getTime(),
        cell: (c) =>
          format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      },
      {
        id: "tipo_consulta",
        header: "Tipo",
        sortable: true,
        searchable: true,
        sortValue: (c) => tipoLabels[c.tipo_consulta] || c.tipo_consulta,
        cell: (c) => tipoLabels[c.tipo_consulta] || c.tipo_consulta,
      },
      {
        id: "parametro_busca",
        header: "Parâmetro",
        sortable: true,
        searchable: true,
        className: "font-mono text-sm",
        cell: (c) => c.parametro_busca,
      },
      {
        id: "motivo",
        header: "Motivo",
        searchable: true,
        className: "text-sm",
        cell: (c) => c.motivo,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (c) => (
          <Badge variant={statusLabels[c.status]?.variant || "secondary"}>
            {statusLabels[c.status]?.label || c.status}
          </Badge>
        ),
      },
      {
        id: "custo",
        header: "Custo",
        sortable: true,
        className: "text-right",
        sortValue: (c) => c.custo,
        cell: (c) => <div className="text-right">R$ {c.custo.toFixed(2)}</div>,
      },
      {
        id: "actions",
        header: "Ações",
        className: "text-right",
        cell: (c) => (
          <div className="flex gap-1 justify-end">
            {c.status === "sucesso" && c.resultado && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVisualizarResultado?.(c);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportar?.(c);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [onVisualizarResultado, onExportar],
  );

  return (
    <DataTable
      data={consultas || []}
      columns={columns}
      rowKey={(c) => c.id}
      searchPlaceholder="Buscar por parâmetro, tipo ou motivo..."
      emptyMessage="Nenhuma consulta realizada ainda"
      pageSize={25}
    />
  );
}
