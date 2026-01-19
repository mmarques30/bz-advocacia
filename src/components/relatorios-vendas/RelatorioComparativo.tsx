import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodoRelatorio } from "@/hooks/useRelatoriosVendas";

interface KPIsData {
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaContato: number;
  taxaConversao: number;
  tempoMedioConversao: number | null;
  valorTotalPropostas: number;
}

interface ComparativoData {
  periodoAtual: KPIsData;
  periodoAnterior: KPIsData;
  variacaoLeads: number;
  variacaoConversao: number;
  variacaoContato: number;
}

interface RelatorioComparativoProps {
  comparativo: ComparativoData | undefined;
  periodo: PeriodoRelatorio;
  isLoading: boolean;
}

export function RelatorioComparativo({ comparativo, periodo, isLoading }: RelatorioComparativoProps) {
  const getPeriodoLabel = (periodo: PeriodoRelatorio, anterior: boolean = false) => {
    switch (periodo) {
      case "semanal":
        return anterior ? "Semana Anterior" : "Esta Semana";
      case "mensal":
        return anterior ? "Mês Anterior" : "Este Mês";
      case "trimestral":
        return anterior ? "Trimestre Anterior" : "Este Trimestre";
    }
  };

  const VariacaoIndicator = ({ valor }: { valor: number }) => {
    if (valor > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{valor.toFixed(1)}%
        </Badge>
      );
    } else if (valor < 0) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          <TrendingDown className="h-3 w-3 mr-1" />
          {valor.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Minus className="h-3 w-3 mr-1" />
        0%
      </Badge>
    );
  };

  if (isLoading) {
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

  const metricas = [
    {
      nome: "Total de Leads",
      atual: comparativo?.periodoAtual.totalLeads || 0,
      anterior: comparativo?.periodoAnterior.totalLeads || 0,
      variacao: comparativo?.variacaoLeads || 0
    },
    {
      nome: "Leads Contatados",
      atual: comparativo?.periodoAtual.leadsContatados || 0,
      anterior: comparativo?.periodoAnterior.leadsContatados || 0,
      variacao: comparativo?.variacaoContato || 0
    },
    {
      nome: "Leads Convertidos",
      atual: comparativo?.periodoAtual.leadsConvertidos || 0,
      anterior: comparativo?.periodoAnterior.leadsConvertidos || 0,
      variacao: comparativo?.variacaoConversao || 0
    },
    {
      nome: "Taxa de Contato",
      atual: `${(comparativo?.periodoAtual.taxaContato || 0).toFixed(1)}%`,
      anterior: `${(comparativo?.periodoAnterior.taxaContato || 0).toFixed(1)}%`,
      variacao: comparativo?.variacaoContato || 0
    },
    {
      nome: "Taxa de Conversão",
      atual: `${(comparativo?.periodoAtual.taxaConversao || 0).toFixed(1)}%`,
      anterior: `${(comparativo?.periodoAnterior.taxaConversao || 0).toFixed(1)}%`,
      variacao: comparativo?.variacaoConversao || 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Períodos</CardTitle>
        <CardDescription>
          Comparação entre {getPeriodoLabel(periodo)} e {getPeriodoLabel(periodo, true)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead className="text-right">{getPeriodoLabel(periodo, true)}</TableHead>
              <TableHead className="text-right">{getPeriodoLabel(periodo)}</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricas.map((metrica) => (
              <TableRow key={metrica.nome}>
                <TableCell className="font-medium">{metrica.nome}</TableCell>
                <TableCell className="text-right text-muted-foreground">{metrica.anterior}</TableCell>
                <TableCell className="text-right font-semibold">{metrica.atual}</TableCell>
                <TableCell className="text-right">
                  <VariacaoIndicator valor={metrica.variacao} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
