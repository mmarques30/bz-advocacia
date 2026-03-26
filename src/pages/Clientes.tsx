import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { ClientesFilters, ClientesFiltersType } from "@/components/clientes/ClientesFilters";
import { ClientesTable } from "@/components/leads/ClientesTable";
import { ClientesKanban } from "@/components/clientes/ClientesKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { ImportClientesPlanilhaDialog } from "@/components/leads/ImportClientesPlanilhaDialog";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { LeadsFilters as LeadsFiltersType, Lead } from "@/types/leads";

export default function Clientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [clienteFilterId, setClienteFilterId] = useState<string | null>(null);
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
    semWhatsapp: false,
    semProcesso: searchParams.get("semProcesso") === "true",
  });

  // Read URL param on mount
  useEffect(() => {
    if (searchParams.get("semProcesso") === "true") {
      setClientesFilters(prev => ({ ...prev, semProcesso: true }));
      // Clean URL param
      searchParams.delete("semProcesso");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

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

  // Fetch lead_ids that have processes (for semProcesso filter)
  const { data: leadIdsComProcesso } = useQuery({
    queryKey: ["lead-ids-com-processo"],
    queryFn: async () => {
      const { data } = await supabase.from("processos").select("lead_id").not("lead_id", "is", null);
      return new Set((data || []).map(p => p.lead_id));
    },
    enabled: clientesFilters.semProcesso,
  });

  const filteredLeads = (() => {
    let result = clienteFilterId
      ? leads?.filter((l) => l.id === clienteFilterId)
      : leads;
    if (clientesFilters.semWhatsapp && result) {
      result = result.filter((l) => !l.telefone || l.telefone.trim() === '');
    }
    if (clientesFilters.semProcesso && result && leadIdsComProcesso) {
      result = result.filter((l) => !leadIdsComProcesso.has(l.id));
    }
    return result;
  })();

  const activeFiltersCount = [
    clientesFilters.origem.length > 0,
    clientesFilters.tipoProcesso.length > 0,
    clientesFilters.statusCliente.length > 0,
    clientesFilters.statusProcesso.length > 0,
    clientesFilters.semWhatsapp,
    clientesFilters.semProcesso,
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
        clienteFilterId={clienteFilterId}
        onClienteFilterChange={setClienteFilterId}
      />

      {view === 'table' ? (
        <ClientesTable
          leads={filteredLeads}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      ) : (
        <ClientesKanban
          leads={filteredLeads}
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
        isCliente={true}
      />
    </div>
  );
}