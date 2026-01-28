import { useState } from "react";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { ClientesFilters, ClientesFiltersType } from "@/components/clientes/ClientesFilters";
import { ClientesTable } from "@/components/leads/ClientesTable";
import { ClientesKanban } from "@/components/clientes/ClientesKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { ImportClientesPlanilhaDialog } from "@/components/leads/ImportClientesPlanilhaDialog";
import { useLeads } from "@/hooks/useLeads";
import { LeadsFilters as LeadsFiltersType, Lead } from "@/types/leads";

export default function Clientes() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showImportPlanilha, setShowImportPlanilha] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Filtros específicos para clientes
  const [clientesFilters, setClientesFilters] = useState<ClientesFiltersType>({
    search: "",
    origem: [],
    tipoProcesso: [],
    statusCliente: [],
    statusProcesso: [],
  });

  // Converter filtros de clientes para o formato esperado pelo hook useLeads
  const leadsFilters: LeadsFiltersType = {
    search: clientesFilters.search,
    status: ['fechado'], // Sempre filtrar apenas clientes (fechados)
    origem: clientesFilters.origem as any[],
    tipoProcesso: clientesFilters.tipoProcesso,
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: clientesFilters.statusCliente,
  };

  const { data: leads, isLoading } = useLeads(leadsFilters);

  const activeFiltersCount = [
    clientesFilters.origem.length > 0,
    clientesFilters.tipoProcesso.length > 0,
    clientesFilters.statusCliente.length > 0,
    clientesFilters.statusProcesso.length > 0,
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
          Gerencie seus clientes ativos e acompanhe os processos
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
        search={clientesFilters.search}
        onSearchChange={(search) => setClientesFilters({ ...clientesFilters, search })}
        activeFiltersCount={activeFiltersCount}
        isClienteTab={true}
      />

      {view === 'table' ? (
        <ClientesTable
          leads={leads}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      ) : (
        <ClientesKanban
          leads={leads}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />
      )}

      <ClientesFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={clientesFilters}
        onFiltersChange={setClientesFilters}
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