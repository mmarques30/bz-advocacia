import { useState, useEffect } from "react";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { ClientesTable } from "@/components/leads/ClientesTable";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { ImportClientesPlanilhaDialog } from "@/components/leads/ImportClientesPlanilhaDialog";
import { useLeads } from "@/hooks/useLeads";
import { LeadsFilters as FiltersType, Lead } from "@/types/leads";

export default function Clientes() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showImportPlanilha, setShowImportPlanilha] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [filters, setFilters] = useState<FiltersType>({
    search: "",
    status: ['fechado'],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });

  const { data: leads, isLoading } = useLeads(filters);

  const activeFiltersCount = [
    filters.origem.length > 0,
    filters.tipoProcesso.length > 0,
    filters.dateRange.start !== null,
    filters.dateRange.end !== null,
    filters.responsavel !== null,
  ].filter(Boolean).length;

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleEdit = (lead: Lead) => {
    setLeadToEdit(lead);
    setShowNewLead(true);
    setSelectedLead(null);
  };

  const handleCloseNewLead = () => {
    setShowNewLead(false);
    setLeadToEdit(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie seus clientes ativos
        </p>
      </div>

      <LeadsHeader
        view={view}
        onViewChange={setView}
        onOpenFilters={() => setShowFilters(true)}
        onNewLead={() => {
          setLeadToEdit(null);
          setShowNewLead(true);
        }}
        onImport={() => setShowImport(true)}
        onImportPlanilha={() => setShowImportPlanilha(true)}
        search={filters.search}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        activeFiltersCount={activeFiltersCount}
        isClienteTab={true}
        hideViewToggle={true}
      />

      <ClientesTable
        leads={leads}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
      />

      <LeadsFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <NewLeadDialog
        open={showNewLead}
        onClose={handleCloseNewLead}
        lead={leadToEdit}
        isCliente={true}
      />

      <ImportLeadsDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        isCliente={true}
      />

      <ImportClientesPlanilhaDialog
        open={showImportPlanilha}
        onClose={() => setShowImportPlanilha(false)}
      />

      <LeadDetailsDialog
        open={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onEdit={handleEdit}
      />
    </div>
  );
}
