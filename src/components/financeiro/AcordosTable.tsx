import { useMemo } from "react";
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
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface AcordosTableProps {
  filters: AcordosFilters;
  onSelectAcordo: (acordoId: string) => void;
  onRegistrarPagamento: (parcelaId: string) => void;
}

interface AcordoRow {
  id: string;
  clienteNome: string;
  tipoServico: string;
  valorTotal: number;
  numeroParcelas: number;
  parcelasPagas: number;
  totalPago: number;
  saldo: number;
  status: string;
  possuiAtraso: boolean;
  proximaParcelaPendenteId: string | null;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function getStatusVariant(status: string) {
  switch (status) {
    case "ativo":
      return "default" as const;
    case "concluido":
      return "secondary" as const;
    case "cancelado":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function AcordosTable({ filters, onSelectAcordo, onRegistrarPagamento }: AcordosTableProps) {
  const { data: acordos, isLoading } = useAcordos(filters);

  // Normaliza os registros para o shape que o DataTable consome.
  // Isolar o calculo aqui evita refazer o trabalho em cada render/sort.
  const rows = useMemo<AcordoRow[]>(() => {
    return (acordos || []).map((a) => {
      const parcelas = a.parcelas || [];
      const parcelasPagas = parcelas.filter((p) => p.status === "pago").length;
      const totalPago = parcelas
        .filter((p) => p.status === "pago")
        .reduce((sum, p) => sum + (p.valor_pago || 0), 0);
      const saldo = a.valor_total - totalPago;
      const possuiAtraso = parcelas.some(
        (p) => p.status !== "pago" && new Date(p.data_vencimento) < new Date(),
      );
      const proxima = parcelas.find((p) => p.status === "pendente");
      return {
        id: a.id,
        clienteNome: a.cliente?.nome_completo || "Cliente",
        tipoServico: a.tipo_servico || "",
        valorTotal: a.valor_total,
        numeroParcelas: a.numero_parcelas,
        parcelasPagas,
        totalPago,
        saldo,
        status: a.status,
        possuiAtraso,
        proximaParcelaPendenteId: proxima?.id || null,
      };
    });
  }, [acordos]);

  const columns = useMemo<DataTableColumn<AcordoRow>[]>(
    () => [
      {
        id: "clienteNome",
        header: "Cliente",
        sortable: true,
        searchable: true,
        sortValue: (r) => r.clienteNome,
        cell: (r) => (
          <div>
            <p className="font-medium">{r.clienteNome}</p>
            {r.possuiAtraso && (
              <Badge variant="destructive" className="text-xs mt-1">
                Em atraso
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "tipoServico",
        header: "Serviço",
        sortable: true,
        searchable: true,
        cell: (r) => r.tipoServico,
      },
      {
        id: "valorTotal",
        header: "Valor Total",
        sortable: true,
        sortValue: (r) => r.valorTotal,
        cell: (r) => brl.format(r.valorTotal),
      },
      {
        id: "parcelasPagas",
        header: "Parcelas Pagas",
        sortable: true,
        sortValue: (r) => r.parcelasPagas / Math.max(1, r.numeroParcelas),
        cell: (r) => `${r.parcelasPagas}/${r.numeroParcelas}`,
      },
      {
        id: "saldo",
        header: "Saldo",
        sortable: true,
        sortValue: (r) => r.saldo,
        cell: (r) => brl.format(r.saldo),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (r) => (
          <Badge variant={getStatusVariant(r.status)}>
            {STATUS_ACORDO_LABELS[r.status as keyof typeof STATUS_ACORDO_LABELS]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir ações do contrato" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelectAcordo(r.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!r.proximaParcelaPendenteId}
                onClick={() => {
                  if (r.proximaParcelaPendenteId) {
                    onRegistrarPagamento(r.proximaParcelaPendenteId);
                  }
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onSelectAcordo, onRegistrarPagamento],
  );

  if (isLoading) {
    return <div className="text-center py-8">Carregando acordos...</div>;
  }

  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Buscar por cliente ou serviço..."
      emptyMessage="Nenhum acordo encontrado"
      pageSize={25}
    />
  );
}
