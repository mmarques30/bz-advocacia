import { useState } from "react";
import { ProcessosHeader } from "@/components/processos/ProcessosHeader";
import { ProcessosFilters } from "@/components/processos/ProcessosFilters";
import { ProcessosTable } from "@/components/processos/ProcessosTable";
import { ProcessoDetailsDialog } from "@/components/processos/ProcessoDetailsDialog";
import { NewProcessoDialog } from "@/components/processos/NewProcessoDialog";
import { AddAndamentoDialog } from "@/components/processos/AddAndamentoDialog";
import { useProcessos } from "@/hooks/useProcessos";
import { ProcessosFilters as FiltersType } from "@/types/processos";

export default function Processos() {
  const [filters, setFilters] = useState<FiltersType>({
    status: ["em_andamento"],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showNewProcesso, setShowNewProcesso] = useState(false);
  const [showPrazos, setShowPrazos] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<string | null>(null);
  const [showAddAndamento, setShowAddAndamento] = useState(false);
  const [processoForAndamento, setProcessoForAndamento] = useState<string | null>(null);

  const { data: processos, isLoading } = useProcessos(filters);

  const handleOpenDetails = (processoId: string) => {
    setSelectedProcesso(processoId);
  };

  const handleAddAndamento = (processoId: string) => {
    setProcessoForAndamento(processoId);
    setShowAddAndamento(true);
  };

  const calculateActiveFilters = (filters: FiltersType): number => {
    let count = 0;
    if (filters.status.length !== 1 || filters.status[0] !== "em_andamento") count++;
    if (filters.tribunal) count++;
    if (filters.tipo) count++;
    if (filters.tem_prazo_proximo) count++;
    if (filters.sem_atualizacao_dias) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Processos</h1>
        <p className="text-muted-foreground">
          Gerencie processos judiciais, prazos e andamentos
        </p>
      </div>

      <ProcessosHeader
        filters={filters}
        onFiltersChange={setFilters}
        onOpenFilters={() => setShowFilters(true)}
        onNewProcesso={() => setShowNewProcesso(true)}
        onViewPrazos={() => setShowPrazos(true)}
        activeFiltersCount={calculateActiveFilters(filters)}
      />

      <ProcessosTable
        processos={processos || []}
        isLoading={isLoading}
        onViewDetails={handleOpenDetails}
        onAddAndamento={handleAddAndamento}
      />

      <ProcessosFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />

      <ProcessoDetailsDialog
        processoId={selectedProcesso}
        open={!!selectedProcesso}
        onClose={() => setSelectedProcesso(null)}
      />

      <NewProcessoDialog
        open={showNewProcesso}
        onClose={() => setShowNewProcesso(false)}
      />

      <AddAndamentoDialog
        processoId={processoForAndamento || ""}
        open={showAddAndamento}
        onClose={() => {
          setShowAddAndamento(false);
          setProcessoForAndamento(null);
        }}
      />
    </div>
  );
}
