import { VisaoGeralKPIs } from "./VisaoGeralKPIs";
import { ReceitasDespesasChart } from "./ReceitasDespesasChart";
import { DespesasPorCategoriaChart } from "./DespesasPorCategoriaChart";
import { DistribuicaoSociasCards } from "./DistribuicaoSociasCards";
import { ParcelasProximasWidget } from "./ParcelasProximasWidget";
import { ResultadoPeriodoCard } from "./ResultadoPeriodoCard";

interface Props {
  ano: number | null;
}

export function VisaoGeralTab({ ano }: Props) {
  return (
    <div className="space-y-6">
      <VisaoGeralKPIs ano={ano} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReceitasDespesasChart ano={ano} />
        <DespesasPorCategoriaChart ano={ano} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DistribuicaoSociasCards ano={ano} />
        <ParcelasProximasWidget />
        <ResultadoPeriodoCard ano={ano} />
      </div>
    </div>
  );
}
