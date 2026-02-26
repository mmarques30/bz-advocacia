import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List } from "lucide-react";

// Manual leads (contact_submissions)
import { useLeads } from "@/hooks/useLeads";
import { LeadsHeader } from "@/components/leads/LeadsHeader";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsOrganicSummary } from "@/components/leads/LeadsOrganicSummary";
import { Lead, LeadsFilters as FiltersType } from "@/types/leads";

// CSV leads (Google Sheets)
import { LeadsCsvTable } from "@/components/leads/LeadsCsvTable";
import { LeadsCsvSummary } from "@/components/leads/LeadsCsvSummary";
import { LeadGeralDetailsDialog } from "@/components/leads/LeadGeralDetailsDialog";
import { useLeadsCsv, CsvLead } from "@/hooks/useLeadsCsv";
import { useLeadsGeral, LeadGeral } from "@/hooks/useLeadsGeral";
import { useLeadStatusOverrides } from "@/hooks/useLeadStatusOverrides";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

const defaultFilters: FiltersType = {
  search: "",
  status: [],
  origem: [],
  tipoProcesso: [],
  dateRange: { start: null, end: null },
  diasParado: { min: 0, max: null },
  responsavel: null,
  statusCliente: [],
};

function csvToLeadGeral(csv: CsvLead): LeadGeral {
  let createdTime: string | null = null;
  if (csv.dataRaw && !isNaN(csv.dataRaw.getTime())) {
    createdTime = csv.dataRaw.toISOString();
  }
  return {
    id: csv.id,
    full_name: csv.nome,
    phone_number: csv.telefone,
    platform: csv.plataforma,
    campaign_name: csv.campanha !== "-" ? csv.campanha : null,
    lead_status: csv.estagio,
    created_time: createdTime,
    tipo_servico: csv.tipoServico !== "-" ? csv.tipoServico : null,
    contato_whatsapp: csv.whatsappStatus || null,
    is_organic: csv.plataforma === "organic",
    ad_id: null, ad_name: null, adset_id: null, adset_name: null,
    bem_inventariar: null, campaign_id: null, form_id: null, form_name: null,
    is_converted: null, is_qualified: null, is_quality: null,
    observacoes: null, preferencia_contato: null, updated_at: null,
  };
}

export default function Leads() {
  const [activeTab, setActiveTab] = useState("leads");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Leads</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads manuais e de anúncios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leads">Leads Orgânicos</TabsTrigger>
          <TabsTrigger value="anuncios">Leads Anúncios</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <ManualLeadsTab />
        </TabsContent>

        <TabsContent value="anuncios">
          <CsvLeadsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================== TAB 1: Manual Leads (contact_submissions) =====================
function ManualLeadsTab() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersType>(defaultFilters);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [nomeFilter, setNomeFilter] = useState<string | null>(null);
  const [origemFilter, setOrigemFilter] = useState<string | null>(null);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.origem.length > 0) count++;
    if (filters.tipoProcesso.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.diasParado.min > 0 || filters.diasParado.max !== null) count++;
    if (filters.responsavel) count++;
    if (filters.statusCliente && filters.statusCliente.length > 0) count++;
    return count;
  }, [filters]);

  const queryFilters: FiltersType = useMemo(() => ({
    ...filters,
    search,
    origem: origemFilter ? [origemFilter as any] : filters.origem,
  }), [filters, search, origemFilter]);

  const { data: leads, isLoading } = useLeads(queryFilters);

  const filteredLeads = useMemo(() => {
    if (!leads) return undefined;
    if (!nomeFilter) return leads;
    return leads.filter(l => l.nome_completo === nomeFilter);
  }, [leads, nomeFilter]);

  return (
    <div className="space-y-4 mt-4">
      <LeadsOrganicSummary leads={filteredLeads} loading={isLoading} />
      <LeadsHeader
        view={view}
        onViewChange={setView}
        onOpenFilters={() => setFiltersOpen(true)}
        onNewLead={() => setNewLeadOpen(true)}
        onImport={() => {}}
        search={search}
        onSearchChange={setSearch}
        activeFiltersCount={activeFilters}
        nomeFilter={nomeFilter}
        onNomeFilterChange={setNomeFilter}
        origemFilter={origemFilter}
        onOrigemFilterChange={setOrigemFilter}
      />

      {view === 'table' ? (
        <TooltipProvider>
          <LeadsTable
            leads={filteredLeads}
            isLoading={isLoading}
            onViewDetails={setSelectedLead}
            onEdit={setEditLead}
          />
        </TooltipProvider>
      ) : (
        <LeadsKanban
          leads={filteredLeads}
          isLoading={isLoading}
          onViewDetails={setSelectedLead}
        />
      )}

      <LeadsFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <NewLeadDialog
        open={newLeadOpen || editLead !== null}
        onClose={() => { setNewLeadOpen(false); setEditLead(null); }}
        lead={editLead}
      />

      <LeadDetailsDialog
        open={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onEdit={(lead) => { setSelectedLead(null); setEditLead(lead); }}
      />
    </div>
  );
}

// ===================== TAB 2: CSV Leads (Google Sheets) =====================
function CsvLeadsTab() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: csvData, isLoading: csvLoading } = useLeadsCsv();
  const { updateObservacoes } = useLeadsGeral();

  const selectedCsv = csvData?.leads?.find(l => l.id === selectedLeadId);
  const selectedLead: LeadGeral | null = selectedCsv ? csvToLeadGeral(selectedCsv) : null;

  const filteredLeads = csvData?.leads?.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.nome.toLowerCase().includes(q) || l.telefone.includes(q);
  });

  const handleSaveObservacoes = (id: string, obs: string) => {
    updateObservacoes.mutate({ id, observacoes: obs });
  };

  return (
    <div className="space-y-4 mt-4">
      <LeadsCsvSummary summary={csvData?.summary} loading={csvLoading} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex border rounded-md">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
            className="gap-1"
          >
            <List className="h-4 w-4" /> Tabela
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
            className="gap-1"
          >
            <LayoutGrid className="h-4 w-4" /> Kanban
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <TooltipProvider>
          <LeadsCsvTable
            leads={filteredLeads}
            isLoading={csvLoading}
            onViewDetails={(id) => setSelectedLeadId(id)}
          />
        </TooltipProvider>
      ) : (
        <KanbanView
          leads={(filteredLeads || []).map(csvToLeadGeral)}
          onViewDetails={(id) => setSelectedLeadId(id)}
        />
      )}

      <LeadGeralDetailsDialog
        open={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
        lead={selectedLead}
        onSaveObservacoes={handleSaveObservacoes}
      />
    </div>
  );
}

// ===================== Kanban DnD Components for CSV =====================
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 space-y-2 max-h-[60vh] overflow-y-auto rounded-lg transition-colors ${
        isOver ? "bg-accent/50 ring-2 ring-primary/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DraggableLeadCard({
  lead,
  onViewDetails,
}: {
  lead: LeadGeral;
  onViewDetails: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        className="bg-background border rounded-md p-3 hover:shadow-sm transition-shadow"
        onClick={() => onViewDetails(lead.id)}
      >
        <p className="font-medium text-sm truncate">{lead.full_name || "Sem nome"}</p>
        <p className="text-xs text-muted-foreground truncate">
          {lead.phone_number?.replace("p:", "")}
        </p>
        {lead.tipo_servico && (
          <p className="text-xs text-muted-foreground mt-1">
            {lead.tipo_servico.replace(/_/g, " ")}
          </p>
        )}
      </div>
    </div>
  );
}

function KanbanView({ leads, onViewDetails }: { leads: LeadGeral[]; onViewDetails: (id: string) => void }) {
  const { overrides, upsertStatus } = useLeadStatusOverrides();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = [
    { key: "NOVO", label: "Novos", color: "border-t-blue-500" },
    { key: "ENVIADO", label: "Enviados", color: "border-t-green-500" },
    { key: "QUALIFICADO", label: "Qualificados", color: "border-t-purple-500" },
    { key: "CONVERTIDO", label: "Convertidos", color: "border-t-emerald-500" },
  ];

  const mergedLeads = useMemo(() => {
    return leads.map((lead) => {
      const override = overrides[lead.id];
      if (override) {
        return { ...lead, lead_status: override };
      }
      return lead;
    });
  }, [leads, overrides]);

  const grouped = columns.map((col) => ({
    ...col,
    leads: mergedLeads.filter((l) => (l.lead_status || "").toUpperCase() === col.key),
  }));

  const knownKeys = columns.map((c) => c.key);
  const others = mergedLeads.filter(
    (l) => !knownKeys.includes((l.lead_status || "").toUpperCase())
  );

  const activeLead = activeId ? mergedLeads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    const colKeys = columns.map((c) => c.key);
    let targetKey: string;
    if (colKeys.includes(overId)) {
      targetKey = overId;
    } else if (overId === "OUTROS") {
      return;
    } else {
      const targetLead = mergedLeads.find((l) => l.id === overId);
      if (!targetLead) return;
      targetKey = (targetLead.lead_status || "").toUpperCase();
    }

    const lead = mergedLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const currentKey = (lead.lead_status || "").toUpperCase();
    if (currentKey === targetKey) return;

    const statusMap: Record<string, string> = {
      NOVO: "Novo",
      ENVIADO: "Enviado",
      QUALIFICADO: "Qualificado",
      CONVERTIDO: "Convertido",
    };
    const newStatus = statusMap[targetKey];
    if (!newStatus) return;

    upsertStatus.mutate({ leadCsvId: leadId, status: newStatus });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {grouped.map((col) => (
          <div key={col.key} className={`border rounded-lg ${col.color} border-t-4 bg-muted/30`}>
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-xs text-muted-foreground">{col.leads.length} leads</span>
            </div>
            <DroppableColumn id={col.key}>
              {col.leads.map((lead) => (
                <DraggableLeadCard key={lead.id} lead={lead} onViewDetails={onViewDetails} />
              ))}
              {col.leads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>
              )}
            </DroppableColumn>
          </div>
        ))}
        {others.length > 0 && (
          <div className="border rounded-lg border-t-4 border-t-gray-400 bg-muted/30">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Outros</h3>
              <span className="text-xs text-muted-foreground">{others.length} leads</span>
            </div>
            <DroppableColumn id="OUTROS">
              {others.map((lead) => (
                <DraggableLeadCard key={lead.id} lead={lead} onViewDetails={onViewDetails} />
              ))}
            </DroppableColumn>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="bg-background border rounded-md p-3 shadow-lg opacity-90 w-56">
            <p className="font-medium text-sm truncate">{activeLead.full_name || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {activeLead.phone_number?.replace("p:", "")}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
