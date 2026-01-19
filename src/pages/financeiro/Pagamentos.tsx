import { DashboardLayout } from "@/components/DashboardLayout";
import { PagamentosAtrasados } from "@/components/financeiro/pagamentos/PagamentosAtrasados";
import { ProximosVencimentos } from "@/components/financeiro/pagamentos/ProximosVencimentos";

export default function FinanceiroPagamentos() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Pagamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe vencimentos, atrasos e pagamentos pendentes
          </p>
        </div>

        <PagamentosAtrasados />

        <ProximosVencimentos dias={7} />
      </div>
    </DashboardLayout>
  );
}
