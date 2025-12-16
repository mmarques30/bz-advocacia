import { DollarSign, TrendingUp, TrendingDown, Percent, RefreshCw } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { useKPIsFinanceirosExternos, useImportarDadosExternos } from "@/hooks/useTransacoesExternas";
import { Button } from "@/components/ui/button";

interface FinanceiroExternoKPIsProps {
  ano?: number;
}

export function FinanceiroExternoKPIs({ ano }: FinanceiroExternoKPIsProps) {
  const { data: kpis, isLoading } = useKPIsFinanceirosExternos(ano);
  const importarDados = useImportarDadosExternos();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dados do Banco Externo</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => importarDados.mutate()}
          disabled={importarDados.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${importarDados.isPending ? 'animate-spin' : ''}`} />
          {importarDados.isPending ? 'Importando...' : 'Sincronizar Dados'}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Receitas do Ano"
          value={formatCurrency(kpis?.totalReceitas || 0)}
          icon={DollarSign}
          trend={kpis?.totalTransacoes || 0}
          loading={isLoading}
        />
        <KPICard
          title="Despesas do Ano"
          value={formatCurrency(kpis?.totalDespesas || 0)}
          icon={TrendingDown}
          loading={isLoading}
        />
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(kpis?.lucroLiquido || 0)}
          icon={TrendingUp}
          trend={Math.round(kpis?.margemLucro || 0)}
          loading={isLoading}
        />
        <KPICard
          title="Margem de Lucro"
          value={`${(kpis?.margemLucro || 0).toFixed(1)}%`}
          icon={Percent}
          loading={isLoading}
        />
      </div>

      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <KPICard
            title="Receitas PF"
            value={formatCurrency(kpis.receitasPF || 0)}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title="Receitas PJ"
            value={formatCurrency(kpis.receitasPJ || 0)}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title="Receita do Mês"
            value={formatCurrency(kpis.receitasMes || 0)}
            icon={TrendingUp}
            loading={isLoading}
          />
          <KPICard
            title="Despesas do Mês"
            value={formatCurrency(kpis.despesasMes || 0)}
            icon={TrendingDown}
            loading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
