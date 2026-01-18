import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HistoricoFilters, getDefaultHistoricoFilters, type HistoricoFiltersState } from "@/components/financeiro/historico/HistoricoFilters";
import { HistoricoTable } from "@/components/financeiro/historico/HistoricoTable";

export default function FinanceiroHistorico() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoricoFiltersState>(getDefaultHistoricoFilters());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Histórico de Transações</h1>
          <p className="text-muted-foreground">
            Todas as transações financeiras registradas
          </p>
        </div>
      </div>

      <HistoricoFilters filters={filters} onChange={setFilters} />
      <HistoricoTable filters={filters} mode="full" />
    </div>
  );
}
