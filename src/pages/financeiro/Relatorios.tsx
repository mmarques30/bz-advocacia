import { useState } from "react";
import { subMonths } from "date-fns";
import { TipoRelatorio } from "@/types/financeiro";
import { RelatorioSelector } from "@/components/financeiro/relatorios/RelatorioSelector";
import { RelatorioCard } from "@/components/financeiro/relatorios/RelatorioCard";
import { RelatorioReceitasPeriodo } from "@/components/financeiro/relatorios/RelatorioReceitasPeriodo";
import { RelatorioInadimplencia } from "@/components/financeiro/relatorios/RelatorioInadimplencia";
import { RelatorioFluxoCaixa } from "@/components/financeiro/relatorios/RelatorioFluxoCaixa";
import { RelatorioPerformanceTipo } from "@/components/financeiro/relatorios/RelatorioPerformanceTipo";
import { RelatorioPerformanceCliente } from "@/components/financeiro/relatorios/RelatorioPerformanceCliente";
import { BarChart3, TrendingDown, TrendingUp, PieChart, Users } from "lucide-react";

export default function FinanceiroRelatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio | null>(null);
  const [dataInicio, setDataInicio] = useState<Date>(subMonths(new Date(), 1));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const relatoriosDisponiveis = [
    {
      tipo: "receitas_periodo" as TipoRelatorio,
      titulo: "Receitas do Período",
      descricao: "Análise detalhada das receitas recebidas",
      icon: BarChart3,
    },
    {
      tipo: "inadimplencia_detalhada" as TipoRelatorio,
      titulo: "Inadimplência Detalhada",
      descricao: "Clientes e valores em atraso",
      icon: TrendingDown,
    },
    {
      tipo: "fluxo_caixa_projetado" as TipoRelatorio,
      titulo: "Fluxo de Caixa Projetado",
      descricao: "Entradas previstas",
      icon: TrendingUp,
    },
    {
      tipo: "performance_tipo_processo" as TipoRelatorio,
      titulo: "Performance por Tipo",
      descricao: "Receita por tipo de serviço",
      icon: PieChart,
    },
    {
      tipo: "performance_cliente" as TipoRelatorio,
      titulo: "Performance por Cliente",
      descricao: "Ranking dos maiores pagadores",
      icon: Users,
    },
  ];

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatoriosDisponiveis.map((relatorio) => (
          <RelatorioCard
            key={relatorio.tipo}
            tipo={relatorio.tipo}
            titulo={relatorio.titulo}
            descricao={relatorio.descricao}
            icon={relatorio.icon}
            isSelected={tipoRelatorio === relatorio.tipo}
            onClick={() => handleSelecionarRelatorio(relatorio.tipo)}
          />
        ))}
      </div>

      <div className="mt-8">{renderRelatorio()}</div>
    </div>
  );
}
