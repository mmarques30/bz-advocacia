import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { ImportClientesPlanilhaDialog } from "@/components/leads/ImportClientesPlanilhaDialog";
import { useLeads } from "@/hooks/useLeads";
import { LeadsFilters as FiltersType, Lead } from "@/types/leads";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo');
  
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showImportPlanilha, setShowImportPlanilha] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [filters, setFilters] = useState<FiltersType>({
    search: "",
    status: [],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
  });

  // Determinar a aba atual - padrão é 'leads'
  const currentTab = tipoParam === 'clientes' ? 'clientes' : 'leads';

  // Aplicar filtros baseado no query parameter
  useEffect(() => {
    if (tipoParam === 'clientes') {
      setFilters(prev => ({
        ...prev,
        status: ['fechado']
      }));
    } else {
      // "leads" ou sem parâmetro = leads ativos
      setFilters(prev => ({
        ...prev,
        status: ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada']
      }));
    }
  }, [tipoParam]);

  const handleTabChange = (value: string) => {
    if (value === 'clientes') {
      navigate('/dashboard/leads?tipo=clientes');
    } else {
      navigate('/dashboard/leads?tipo=leads');
    }
  };

  const { data: leads, isLoading } = useLeads(filters);

  const activeFiltersCount = [
    filters.status.length > 0,
    filters.origem.length > 0,
    filters.tipoProcesso.length > 0,
    filters.dateRange.start !== null,
    filters.dateRange.end !== null,
    filters.diasParado.max !== null || filters.diasParado.min > 0,
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
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Vendas</h1>
        <p className="text-muted-foreground">
          Gerencie leads e clientes em um único lugar
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>
      </Tabs>

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
        isClienteTab={currentTab === 'clientes'}
      />

      {view === 'table' ? (
        <LeadsTable
          leads={leads}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      ) : (
        <LeadsKanban
          leads={leads}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />
      )}

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
        isCliente={currentTab === 'clientes'}
      />

      <ImportLeadsDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        isCliente={currentTab === 'clientes'}
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
