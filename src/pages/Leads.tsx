import { useState } from "react";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { LeadsCsvTable } from "@/components/leads/LeadsCsvTable";
import { LeadsCsvSummary } from "@/components/leads/LeadsCsvSummary";
import { useLeads } from "@/hooks/useLeads";
import { useLeadsCsv } from "@/hooks/useLeadsCsv";
import { LeadsFilters as FiltersType, Lead } from "@/types/leads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Leads() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [nomeFilter, setNomeFilter] = useState<string | null>(null);
  const [origemFilter, setOrigemFilter] = useState<string | null>(null);

  const [filters, setFilters] = useState<FiltersType>({
    search: "",
    status: ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada'],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });

  const handleNomeFilterChange = (nome: string | null) => {
    setNomeFilter(nome);
    setFilters(prev => ({ ...prev, search: nome || "" }));
  };

  const handleOrigemFilterChange = (origem: string | null) => {
    setOrigemFilter(origem);
    setFilters(prev => ({ ...prev, origem: origem ? [origem as any] : [] }));
  };

  const { data: leads, isLoading } = useLeads(filters);
  const { data: csvData, isLoading: csvLoading } = useLeadsCsv();

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
          Gerencie seus leads e oportunidades de vendas
        </p>
      </div>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList>
          <TabsTrigger value="csv">Leads Meta Ads</TabsTrigger>
          <TabsTrigger value="sistema">Leads do Sistema</TabsTrigger>
        </TabsList>

        {/* Aba CSV - Meta Ads */}
        <TabsContent value="csv" className="space-y-6">
          <LeadsCsvSummary summary={csvData?.summary} loading={csvLoading} />
          <TooltipProvider>
            <LeadsCsvTable leads={csvData?.leads} isLoading={csvLoading} />
          </TooltipProvider>
        </TabsContent>

        {/* Aba Sistema - Leads internos */}
        <TabsContent value="sistema" className="space-y-6">
          <LeadsHeader
            view={view}
            onViewChange={setView}
            onOpenFilters={() => setShowFilters(true)}
            onNewLead={() => {
              setLeadToEdit(null);
              setShowNewLead(true);
            }}
            onImport={() => setShowImport(true)}
            search={filters.search}
            onSearchChange={(search) => setFilters({ ...filters, search })}
            activeFiltersCount={activeFiltersCount}
            isClienteTab={false}
            nomeFilter={nomeFilter}
            onNomeFilterChange={handleNomeFilterChange}
            origemFilter={origemFilter}
            onOrigemFilterChange={handleOrigemFilterChange}
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
        </TabsContent>
      </Tabs>

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
        isCliente={false}
      />

      <ImportLeadsDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        isCliente={false}
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
