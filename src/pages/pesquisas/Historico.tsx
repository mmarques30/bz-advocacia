import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricoTable } from "@/components/pesquisas/HistoricoTable";
import { useHistoricoConsultas } from "@/hooks/useHistoricoConsultas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipoConsulta, StatusConsulta, HistoricoFilters } from "@/types/pesquisas";

export default function Historico() {
  const [filters, setFilters] = useState<HistoricoFilters>({});
  const { data: consultas, isLoading } = useHistoricoConsultas(filters);

  const custoTotal = consultas?.reduce((acc, c) => acc + Number(c.custo), 0) || 0;

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Consultas</h1>
          <p className="text-muted-foreground mt-2">
            Todas as consultas realizadas com filtros e estatísticas
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre o histórico de consultas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={filters.tipo || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, tipo: value as TipoConsulta || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="veiculo">Veículo</SelectItem>
                    <SelectItem value="pessoa">Pessoa</SelectItem>
                    <SelectItem value="imovel">Imóvel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value as StatusConsulta || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="sucesso">Sucesso</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                    <SelectItem value="sem_dados">Sem dados</SelectItem>
                    <SelectItem value="api_nao_configurada">API não configurada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Período</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{consultas?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {custoTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <HistoricoTable consultas={consultas || []} />
            )}
          </CardContent>
        </Card>
      </div>
  );
}
