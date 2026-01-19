import { useState } from "react";
import { subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { TipoRelatorio } from "@/types/financeiro";
import { RelatorioSelector } from "@/components/financeiro/relatorios/RelatorioSelector";
import { RelatorioReceitasPeriodo } from "@/components/financeiro/relatorios/RelatorioReceitasPeriodo";
import { RelatorioInadimplencia } from "@/components/financeiro/relatorios/RelatorioInadimplencia";
import { RelatorioFluxoCaixa } from "@/components/financeiro/relatorios/RelatorioFluxoCaixa";
import { RelatorioPerformanceTipo } from "@/components/financeiro/relatorios/RelatorioPerformanceTipo";
import { RelatorioPerformanceCliente } from "@/components/financeiro/relatorios/RelatorioPerformanceCliente";
import { RelatorioDespesasPeriodo } from "@/components/financeiro/relatorios/RelatorioDespesasPeriodo";
import { RelatorioDespesasCategoria } from "@/components/financeiro/relatorios/RelatorioDespesasCategoria";
import { BarChart3, TrendingDown, TrendingUp, PieChart, Users, Receipt, Tags } from "lucide-react";

const relatoriosDisponiveis = [
  {
    tipo: "receitas_periodo" as TipoRelatorio,
    titulo: "Receitas do Período",
    descricao: "Análise detalhada das receitas recebidas",
    icon: BarChart3,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  {
    tipo: "inadimplencia_detalhada" as TipoRelatorio,
    titulo: "Inadimplência Detalhada",
    descricao: "Clientes e valores em atraso",
    icon: TrendingDown,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
  {
    tipo: "fluxo_caixa_projetado" as TipoRelatorio,
    titulo: "Fluxo de Caixa Projetado",
    descricao: "Entradas previstas para os próximos meses",
    icon: TrendingUp,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    tipo: "performance_tipo_processo" as TipoRelatorio,
    titulo: "Performance por Tipo",
    descricao: "Receita por tipo de serviço",
    icon: PieChart,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    tipo: "performance_cliente" as TipoRelatorio,
    titulo: "Performance por Cliente",
    descricao: "Ranking dos maiores pagadores",
    icon: Users,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  {
    tipo: "despesas_periodo" as TipoRelatorio,
    titulo: "Despesas do Período",
    descricao: "Análise detalhada das despesas",
    icon: Receipt,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    tipo: "despesas_categoria" as TipoRelatorio,
    titulo: "Despesas por Categoria",
    descricao: "Distribuição de despesas por tipo",
    icon: Tags,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
  },
];

export default function FinanceiroRelatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio | null>(null);
  const [dataInicio, setDataInicio] = useState<Date>(subMonths(new Date(), 1));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const handleSelecionarRelatorio = (tipo: TipoRelatorio) => {
    setTipoRelatorio(tipo);
    setMostrarRelatorio(true);
  };

  const handleGerarRelatorio = () => {
    if (tipoRelatorio) {
      setMostrarRelatorio(true);
    }
  };

  const renderRelatorio = () => {
    if (!mostrarRelatorio || !tipoRelatorio) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Selecione um relatório acima para visualizar
          </p>
        </div>
      );
    }

    switch (tipoRelatorio) {
      case "receitas_periodo":
        return <RelatorioReceitasPeriodo dataInicio={dataInicio} dataFim={dataFim} />;
      case "inadimplencia_detalhada":
        return <RelatorioInadimplencia />;
      case "fluxo_caixa_projetado":
        return <RelatorioFluxoCaixa />;
      case "performance_tipo_processo":
        return <RelatorioPerformanceTipo />;
      case "performance_cliente":
        return <RelatorioPerformanceCliente />;
      case "despesas_periodo":
        return <RelatorioDespesasPeriodo dataInicio={dataInicio} dataFim={dataFim} />;
      case "despesas_categoria":
        return <RelatorioDespesasCategoria />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
        <p className="text-muted-foreground mt-2">
          Visualize relatórios detalhados e análises financeiras
        </p>
      </div>

      <RelatorioSelector
        tipoRelatorio={tipoRelatorio}
        setTipoRelatorio={setTipoRelatorio}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        onGerar={handleGerarRelatorio}
      />

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {relatoriosDisponiveis.map((relatorio) => (
              <div
                key={relatorio.tipo}
                className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  tipoRelatorio === relatorio.tipo ? "bg-accent" : ""
                }`}
                onClick={() => handleSelecionarRelatorio(relatorio.tipo)}
              >
                {/* Ícone */}
                <div className={`p-3 rounded-lg ${relatorio.iconBg} shrink-0`}>
                  <relatorio.icon className={`h-5 w-5 ${relatorio.iconColor}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{relatorio.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {relatorio.descricao}
                  </p>
                </div>

                {/* Botão */}
                <Button
                  variant={tipoRelatorio === relatorio.tipo ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 gap-2"
                >
                  Gerar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">{renderRelatorio()}</div>
    </div>
  );
}
