import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import { useHistoricoConsultas } from "@/hooks/useHistoricoConsultas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipoConsulta, StatusConsulta, HistoricoFilters, ConsultaRealizada } from "@/types/pesquisas";

const tipoLabels: Record<string, string> = {
  cnpj: "Empresa (CNPJ)",
  cep: "Endereço (CEP)",
  cpf: "Pessoa (CPF)",
  processo: "Processo",
};

const statusVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  sucesso: "default",
  erro: "destructive",
  sem_dados: "secondary",
  api_nao_configurada: "outline",
};

const statusLabels: Record<string, string> = {
  sucesso: "Sucesso",
  erro: "Erro",
  sem_dados: "Sem dados",
  api_nao_configurada: "API n/d",
};

export default function Historico() {
  const [filters, setFilters] = useState<HistoricoFilters>({});
  const [periodo, setPeriodo] = useState<string>("30");

  // Aplica filtro de periodo no cliente — o hook ja aceita dataInicio/Fim,
  // mas como o numero de consultas e pequeno e a UI permite trocar rapido,
  // filtramos em memoria pra evitar refetch a cada mudanca.
  const { data: consultas, isLoading } = useHistoricoConsultas(filters);

  const consultasFiltradas = useMemo<ConsultaRealizada[]>(() => {
    if (!consultas) return [];
    if (periodo === "all") return consultas;
    const dias = parseInt(periodo, 10);
    if (Number.isNaN(dias)) return consultas;
    const corte = Date.now() - dias * 24 * 60 * 60 * 1000;
    return consultas.filter((c) => new Date(c.created_at).getTime() >= corte);
  }, [consultas, periodo]);

  const stats = useMemo(() => {
    const total = consultasFiltradas.length;
    const sucesso = consultasFiltradas.filter((c) => c.status === "sucesso").length;
    const repetidos = new Map<string, number>();
    consultasFiltradas.forEach((c) => {
      repetidos.set(c.parametro_busca, (repetidos.get(c.parametro_busca) || 0) + 1);
    });
    const totalRepetidas = Array.from(repetidos.values()).filter((q) => q > 1).length;
    return { total, sucesso, totalRepetidas };
  }, [consultasFiltradas]);

  const columns = useMemo<DataTableColumn<ConsultaRealizada>[]>(
    () => [
      {
        id: "created_at",
        header: "Data",
        sortable: true,
        sortValue: (c) => new Date(c.created_at).getTime(),
        cell: (c) => format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
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
        sortable: true,
        searchable: true,
        cell: (c) => c.motivo,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortValue: (c) => c.status,
        cell: (c) => (
          <Badge variant={statusVariant[c.status] || "secondary"}>
            {statusLabels[c.status] || c.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Histórico de Consultas</h1>
        <p className="text-muted-foreground mt-2">
          Todas as consultas realizadas (apenas Empresa/CNPJ disponivel — Pessoa e Processo dependem de APIs pagas)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine o histórico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={filters.tipo || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, tipo: value === "all" ? undefined : (value as TipoConsulta) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cnpj">Empresa (CNPJ)</SelectItem>
                  <SelectItem value="cep">Endereço (CEP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? undefined : (value as StatusConsulta) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                  <SelectItem value="sem_dados">Sem dados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sucesso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Parâmetros repetidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRepetidas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultas realizadas</CardTitle>
          <CardDescription>Histórico completo, ordenado por data</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <DataTable
              data={consultasFiltradas}
              columns={columns}
              rowKey={(c) => c.id}
              searchPlaceholder="Buscar por parâmetro, tipo ou motivo..."
              emptyMessage="Nenhuma consulta encontrada no período"
              pageSize={25}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
