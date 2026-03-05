import { useState } from "react";
import { AcordosHeader } from "@/components/financeiro/AcordosHeader";
import { AcordosTable } from "@/components/financeiro/AcordosTable";
import { NewAcordoDialog } from "@/components/financeiro/NewAcordoDialog";
import { AcordoDetailsDialog } from "@/components/financeiro/AcordoDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import type { AcordosFilters } from "@/types/financeiro";

export default function FinanceiroAcordos() {
  const [filters, setFilters] = useState<AcordosFilters>({});
  const [newAcordoDialogOpen, setNewAcordoDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAcordoId, setSelectedAcordoId] = useState<string | null>(null);
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Contratos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todos os contratos financeiros
        </p>
      </div>

      <AcordosHeader
        filters={filters}
        onFiltersChange={setFilters}
        onNewAcordo={() => setNewAcordoDialogOpen(true)}
      />

      <AcordosTable
        filters={filters}
        onSelectAcordo={(id) => {
          setSelectedAcordoId(id);
          setDetailsDialogOpen(true);
        }}
        onRegistrarPagamento={(parcelaId) => {
          setSelectedParcelaId(parcelaId);
          setPaymentDialogOpen(true);
        }}
      />

      <NewAcordoDialog
        open={newAcordoDialogOpen}
        onClose={() => setNewAcordoDialogOpen(false)}
      />

      <AcordoDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        acordoId={selectedAcordoId}
        onRegistrarPagamento={(parcelaId) => {
          setSelectedParcelaId(parcelaId);
          setDetailsDialogOpen(false);
          setPaymentDialogOpen(true);
        }}
      />

      <RegistrarPagamentoDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        parcelaId={selectedParcelaId}
      />
    </div>
  );
}
