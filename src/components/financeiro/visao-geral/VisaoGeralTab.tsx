import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ChevronRight } from "lucide-react";
import { VisaoGeralKPIs } from "./VisaoGeralKPIs";
import { ReceitasDespesasChart } from "./ReceitasDespesasChart";
import { DespesasPorCategoriaChart } from "./DespesasPorCategoriaChart";
import { ResultadoPeriodoCard } from "./ResultadoPeriodoCard";
import { useTotalParcelasPendentes } from "@/hooks/useVisaoGeralFinanceiro";

interface Props {
  ano: number | null;
  // Mês selecionado no header (ao lado do ano). null = todos os meses.
  mes: number | null;
  onNavigateToAcordos: () => void;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function TotalParcelasPendentesCard({ onClick }: { onClick: () => void }) {
  const { data, isLoading } = useTotalParcelasPendentes();

  if (isLoading) return <Skeleton className="h-24" />;

  const total = data?.total ?? 0;
  const count = data?.count ?? 0;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Total de Parcelas Pendentes</p>
            <p className="text-2xl font-bold text-primary">{fmtCurrency(total)}</p>
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? "parcela aguardando recebimento" : "parcelas aguardando recebimento"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </button>
  );
}

export function VisaoGeralTab({ ano, mes, onNavigateToAcordos }: Props) {
  return (
    <div className="space-y-6">
      {/* Card de total de parcelas pendentes — clique navega para aba Acordos e Parcelas */}
      <TotalParcelasPendentesCard onClick={onNavigateToAcordos} />

      <VisaoGeralKPIs ano={ano} mes={mes} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReceitasDespesasChart ano={ano} />
        <DespesasPorCategoriaChart ano={ano} mes={mes} />
      </div>

      <ResultadoPeriodoCard ano={ano} />
    </div>
  );
}
