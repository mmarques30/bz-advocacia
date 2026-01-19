import { useState } from "react";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { FileBarChart, TrendingUp, BarChart3, Filter, PieChart, Phone } from "lucide-react";
import { TipoRelatorioVendas } from "@/types/relatorios-vendas";
import { RelatorioVendasSelector } from "@/components/relatorios-vendas/RelatorioVendasSelector";
import { RelatorioVendasCard } from "@/components/relatorios-vendas/RelatorioVendasCard";
import { RelatorioComparativoConversao } from "@/components/relatorios-vendas/RelatorioComparativoConversao";
import { RelatorioPerformanceCampanha } from "@/components/relatorios-vendas/RelatorioPerformanceCampanha";
import { RelatorioFunilVendas } from "@/components/relatorios-vendas/RelatorioFunilVendas";
import { RelatorioLeadsStatus } from "@/components/relatorios-vendas/RelatorioLeadsStatus";
import { RelatorioPerformanceContato } from "@/components/relatorios-vendas/RelatorioPerformanceContato";

const relatoriosDisponiveis = [
  {
    tipo: "comparativo_conversao" as TipoRelatorioVendas,
    titulo: "Comparativo de Conversão",
    descricao: "Leads gerados vs contatados vs convertidos",
    icon: TrendingUp,
  },
  {
    tipo: "performance_campanha" as TipoRelatorioVendas,
    titulo: "Performance por Campanha",
    descricao: "Análise detalhada por fonte/campanha",
    icon: BarChart3,
  },
  {
    tipo: "funil_vendas" as TipoRelatorioVendas,
    titulo: "Funil de Vendas",
    descricao: "Visualização completa do funil",
    icon: Filter,
  },
  {
    tipo: "leads_status" as TipoRelatorioVendas,
    titulo: "Leads por Status",
    descricao: "Distribuição por estágio atual",
    icon: PieChart,
  },
  {
    tipo: "performance_contato" as TipoRelatorioVendas,
    titulo: "Performance de Contato",
    descricao: "Taxa de resposta e tempo de contato",
    icon: Phone,
  },
];

export default function RelatoriosVendas() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorioVendas | null>(null);
  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [dataFim, setDataFim] = useState<Date>(endOfMonth(new Date()));
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const handleSelecionarRelatorio = (tipo: TipoRelatorioVendas) => {
    setTipoRelatorio(tipo);
    setMostrarRelatorio(true);
  };

  const handleGerarRelatorio = () => {
    if (tipoRelatorio) {
      setMostrarRelatorio(true);
    }
  };

  const renderRelatorio = () => {
    if (!mostrarRelatorio || !tipoRelatorio) return null;

    switch (tipoRelatorio) {
      case "comparativo_conversao":
        return <RelatorioComparativoConversao dataInicio={dataInicio} dataFim={dataFim} />;
      case "performance_campanha":
        return <RelatorioPerformanceCampanha dataInicio={dataInicio} dataFim={dataFim} />;
      case "funil_vendas":
        return <RelatorioFunilVendas dataInicio={dataInicio} dataFim={dataFim} />;
      case "leads_status":
        return <RelatorioLeadsStatus dataInicio={dataInicio} dataFim={dataFim} />;
      case "performance_contato":
        return <RelatorioPerformanceContato dataInicio={dataInicio} dataFim={dataFim} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileBarChart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Vendas</h1>
          <p className="text-muted-foreground">
            Relatórios prontos para enviar à sua agência de marketing
          </p>
        </div>
      </div>

      {/* Seletor de relatório */}
      <RelatorioVendasSelector
        tipoRelatorio={tipoRelatorio}
        setTipoRelatorio={setTipoRelatorio}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        onGerar={handleGerarRelatorio}
      />

      {/* Grid de cards de relatório */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatoriosDisponiveis.map((relatorio) => (
          <RelatorioVendasCard
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

      {/* Relatório selecionado */}
      {renderRelatorio()}
    </div>
  );
}
