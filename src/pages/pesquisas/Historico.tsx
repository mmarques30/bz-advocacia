import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepetidasTable } from "@/components/pesquisas/RepetidasTable";
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

interface ConsultaAgrupada {
  parametro: string;
  tipo: string;
  quantidade: number;
  ultimaConsulta: string;
}

export default function Historico() {
  const [filters, setFilters] = useState<HistoricoFilters>({});
  const { data: consultas, isLoading } = useHistoricoConsultas(filters);

  // Agrupar consultas por parâmetro e contar repetidas
  const { consultasRepetidas, totalRepetidas } = useMemo(() => {
    if (!consultas) return { consultasRepetidas: [], totalRepetidas: 0 };

    const agrupadas = consultas.reduce((acc, consulta) => {
      const key = consulta.parametro_busca;
      if (!acc[key]) {
        acc[key] = {
          parametro: key,
          tipo: consulta.tipo_consulta,
          quantidade: 0,
          ultimaConsulta: consulta.created_at,
        };
      }
      acc[key].quantidade++;
      // Atualizar última consulta se for mais recente
      if (new Date(consulta.created_at) > new Date(acc[key].ultimaConsulta)) {
        acc[key].ultimaConsulta = consulta.created_at;
      }
      return acc;
    }, {} as Record<string, ConsultaAgrupada>);

    const repetidas = Object.values(agrupadas)
      .filter(item => item.quantidade > 1)
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      consultasRepetidas: repetidas,
      totalRepetidas: repetidas.length,
    };
  }, [consultas]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-seasons text-primary">Histórico de Consultas</h1>
          <p className="text-muted-foreground mt-2">
            Análise de consultas repetidas e estatísticas
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
                  value={filters.tipo || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, tipo: value === "all" ? undefined : value as TipoConsulta })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="processo">Processo</SelectItem>
                    <SelectItem value="cpf">Pessoa (CPF)</SelectItem>
                    <SelectItem value="cnpj">Empresa (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value === "all" ? undefined : value as StatusConsulta })
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
              <CardTitle>Pesquisas Repetidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRepetidas}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Parâmetros pesquisados mais de uma vez
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros Repetidos</CardTitle>
            <CardDescription>
              Dados que foram pesquisados mais de uma vez
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <RepetidasTable consultas={consultasRepetidas} />
            )}
          </CardContent>
        </Card>
      </div>
  );
}
