import { useState } from "react";
import { Card } from "@/components/ui/card";
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb";
import { RelatorioClienteSelector } from "@/components/leads/relatorios/RelatorioClienteSelector";
import { RelatorioClienteCard } from "@/components/leads/relatorios/RelatorioClienteCard";
import { RelatorioStatusProcessos } from "@/components/leads/relatorios/RelatorioStatusProcessos";
import { RelatorioHistoricoPagamentos } from "@/components/leads/relatorios/RelatorioHistoricoPagamentos";
import { RelatorioProximosVencimentos } from "@/components/leads/relatorios/RelatorioProximosVencimentos";
import { RelatorioAndamentosRecentes } from "@/components/leads/relatorios/RelatorioAndamentosRecentes";
import { RelatorioDocumentosDisponiveis } from "@/components/leads/relatorios/RelatorioDocumentosDisponiveis";
import { RelatorioResumoCompleto } from "@/components/leads/relatorios/RelatorioResumoCompleto";
import { FileText, DollarSign, Calendar, Activity, Files, FileCheck } from "lucide-react";

type TipoRelatorio = 
  | "status-processos"
  | "historico-pagamentos"
  | "proximos-vencimentos"
  | "andamentos-recentes"
  | "documentos-disponiveis"
  | "resumo-completo"
  | null;

export default function RelatoriosCliente() {
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [relatorioAtivo, setRelatorioAtivo] = useState<TipoRelatorio>(null);

  const relatorios = [
    {
      id: "status-processos" as const,
      titulo: "Status dos Processos",
      descricao: "Visualize todos os processos e seus status atuais",
      icon: FileText,
    },
    {
      id: "historico-pagamentos" as const,
      titulo: "Histórico de Pagamentos",
      descricao: "Consulte pagamentos realizados e pendentes",
      icon: DollarSign,
    },
    {
      id: "proximos-vencimentos" as const,
      titulo: "Próximos Vencimentos",
      descricao: "Veja as parcelas com vencimento próximo",
      icon: Calendar,
    },
    {
      id: "andamentos-recentes" as const,
      titulo: "Andamentos Recentes",
      descricao: "Acompanhe as últimas movimentações processuais",
      icon: Activity,
    },
    {
      id: "documentos-disponiveis" as const,
      titulo: "Documentos Disponíveis",
      descricao: "Acesse documentos relacionados aos processos",
      icon: Files,
    },
    {
      id: "resumo-completo" as const,
      titulo: "Resumo Completo",
      descricao: "Relatório executivo com todas as informações",
      icon: FileCheck,
    },
  ];

  const renderRelatorio = () => {
    if (!clienteSelecionado || !relatorioAtivo) return null;

    switch (relatorioAtivo) {
      case "status-processos":
        return <RelatorioStatusProcessos clienteId={clienteSelecionado} />;
      case "historico-pagamentos":
        return (
          <RelatorioHistoricoPagamentos
            clienteId={clienteSelecionado}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        );
      case "proximos-vencimentos":
        return <RelatorioProximosVencimentos clienteId={clienteSelecionado} />;
      case "andamentos-recentes":
        return <RelatorioAndamentosRecentes clienteId={clienteSelecionado} />;
      case "documentos-disponiveis":
        return <RelatorioDocumentosDisponiveis clienteId={clienteSelecionado} />;
      case "resumo-completo":
        return (
          <RelatorioResumoCompleto
            clienteId={clienteSelecionado}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <DynamicBreadcrumb />
        <h1 className="text-3xl font-seasons font-bold text-foreground mt-4">
          Relatórios para Clientes
        </h1>
        <p className="text-muted-foreground mt-2">
          Gere relatórios personalizados para enviar aos seus clientes
        </p>
      </div>

      <RelatorioClienteSelector
        clienteSelecionado={clienteSelecionado}
        onClienteChange={setClienteSelecionado}
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
      />

      {clienteSelecionado && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatorios.map((relatorio) => (
              <RelatorioClienteCard
                key={relatorio.id}
                titulo={relatorio.titulo}
                descricao={relatorio.descricao}
                icon={relatorio.icon}
                ativo={relatorioAtivo === relatorio.id}
                onClick={() => setRelatorioAtivo(relatorio.id)}
              />
            ))}
          </div>

          {relatorioAtivo && (
            <Card className="p-6">
              {renderRelatorio()}
            </Card>
          )}
        </>
      )}

      {!clienteSelecionado && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Selecione um cliente para visualizar os relatórios disponíveis
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
