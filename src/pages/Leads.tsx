import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, LayoutGrid, List, Table2, ArrowUpDown, Clock, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORIGEM_LABELS, LeadOrigem } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";

// Manual leads (contact_submissions)
import { useLeads } from "@/hooks/useLeads";
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
  status: ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'perdido'],
  origem: [],
  tipoProcesso: [],
  dateRange: { start: null, end: null },
  diasParado: { min: 0, max: null },
  responsavel: null,
  statusCliente: [],
};

function csvToLeadGeral(csv: CsvLead, overrides?: Record<string, string>): LeadGeral {
  let createdTime: string | null = null;
  if (csv.dataRaw && !isNaN(csv.dataRaw.getTime())) {
    createdTime = csv.dataRaw.toISOString();
  }
  const resolvedEstagio = overrides?.[csv.id] || csv.estagio;
  return {
    id: csv.id,
    full_name: csv.nome,
    phone_number: csv.telefone,
    platform: csv.plataforma,
    campaign_name: csv.campanha !== "-" ? csv.campanha : null,
    lead_status: resolvedEstagio,
    created_time: createdTime,
    tipo_servico: csv.tipoServico !== "-" ? csv.tipoServico : null,
    contato_whatsapp: csv.whatsappStatus || null,
    is_organic: csv.plataforma === "organic",
    ad_id: null, ad_name: csv.adName !== "-" ? csv.adName : null, adset_id: null, adset_name: csv.adsetName !== "-" ? csv.adsetName : null,
    bem_inventariar: null, campaign_id: null, form_id: null, form_name: csv.formName !== "-" ? csv.formName : null,
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
  const [nomes, setNomes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("mais_recente");

  useEffect(() => {
    const fetchNomes = async () => {
      const { data } = await supabase
        .from('contact_submissions')
        .select('nome_completo')
        .neq('estagio', 'fechado')
        .order('nome_completo');
      if (data) setNomes([...new Set(data.map(d => d.nome_completo))]);
    };
    fetchNomes();
  }, []);

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
    let result = nomeFilter ? leads.filter(l => l.nome_completo === nomeFilter) : [...leads];
    result.sort((a, b) => {
      switch (sortOrder) {
        case "mais_antiga": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "nome_az": return a.nome_completo.localeCompare(b.nome_completo);
        case "nome_za": return b.nome_completo.localeCompare(a.nome_completo);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [leads, nomeFilter, sortOrder]);

  return (
    <div className="space-y-4 mt-4">
      <LeadsOrganicSummary leads={filteredLeads} loading={isLoading} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <Button onClick={() => setNewLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Lead
          </Button>

          <Select value={nomeFilter || "all"} onValueChange={(v) => setNomeFilter(v === "all" ? null : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os nomes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os nomes</SelectItem>
              {nomes.map((nome) => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={origemFilter || "all"} onValueChange={(v) => setOrigemFilter(v === "all" ? null : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mais_recente">Mais recentes</SelectItem>
              <SelectItem value="mais_antiga">Mais antigos</SelectItem>
              <SelectItem value="nome_az">Nome A-Z</SelectItem>
              <SelectItem value="nome_za">Nome Z-A</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setFiltersOpen(true)} className="relative">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">{activeFilters}</Badge>
            )}
          </Button>
        </div>

        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'table' | 'kanban')}>
          <ToggleGroupItem value="table" aria-label="Tabela"><Table2 className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'table' ? (
        <TooltipProvider>
          <LeadsTable leads={filteredLeads} isLoading={isLoading} onViewDetails={setSelectedLead} onEdit={setEditLead} />
        </TooltipProvider>
      ) : (
        <LeadsKanban leads={filteredLeads} isLoading={isLoading} onViewDetails={setSelectedLead} />
      )}

      <LeadsFilters open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} onFiltersChange={setFilters} />
      <NewLeadDialog open={newLeadOpen || editLead !== null} onClose={() => { setNewLeadOpen(false); setEditLead(null); }} lead={editLead} />
      <LeadDetailsDialog open={selectedLead !== null} onClose={() => setSelectedLead(null)} lead={selectedLead} onEdit={(lead) => { setSelectedLead(null); setEditLead(lead); }} />
    </div>
  );
}

// ===================== TAB 2: CSV Leads (Google Sheets) =====================
function CsvLeadsTab() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [nomeFilter, setNomeFilter] = useState<string | null>(null);
  const [origemFilter, setOrigemFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("mais_recente");

  const { data: csvData, isLoading: csvLoading } = useLeadsCsv();
  const { updateObservacoes } = useLeadsGeral();

  const { overrides } = useLeadStatusOverrides();

  const selectedCsv = csvData?.leads?.find(l => l.id === selectedLeadId);
  const selectedLead: LeadGeral | null = selectedCsv ? csvToLeadGeral(selectedCsv, overrides) : null;

  const uniqueNomes = useMemo(() => {
    if (!csvData?.leads) return [];
    return [...new Set(csvData.leads.map(l => l.nome).filter(Boolean))].sort();
  }, [csvData?.leads]);

  const PLATAFORMA_LABELS: Record<string, string> = {
    fb: "Facebook",
    ig: "Instagram",
    organic: "Orgânico",
  };

  const uniqueOrigens = useMemo(() => {
    if (!csvData?.leads) return [];
    return [...new Set(csvData.leads.map(l => l.plataforma))].sort();
  }, [csvData?.leads]);

  const filteredLeads = useMemo(() => {
    const base = csvData?.leads?.filter(l => {
      if (nomeFilter && l.nome !== nomeFilter) return false;
      if (origemFilter && l.plataforma !== origemFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return l.nome.toLowerCase().includes(q) || l.telefone.includes(q);
    });
    // Apply overrides to estagio
    const withOverrides = base?.map(l => ({
      ...l,
      estagio: overrides[l.id] || l.estagio,
    }));
    // Sort
    withOverrides?.sort((a, b) => {
      switch (sortOrder) {
        case "mais_antiga": return (a.dataRaw?.getTime() || 0) - (b.dataRaw?.getTime() || 0);
        case "nome_az": return a.nome.localeCompare(b.nome);
        case "nome_za": return b.nome.localeCompare(a.nome);
        default: return (b.dataRaw?.getTime() || 0) - (a.dataRaw?.getTime() || 0);
      }
    });
    return withOverrides;
  }, [csvData?.leads, search, nomeFilter, origemFilter, overrides, sortOrder]);

  const handleSaveObservacoes = (id: string, obs: string) => {
    updateObservacoes.mutate({ id, observacoes: obs });
  };

  return (
    <div className="space-y-4 mt-4">
      <LeadsCsvSummary summary={csvData?.summary} loading={csvLoading} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={nomeFilter || "all"} onValueChange={(v) => setNomeFilter(v === "all" ? null : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os nomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os nomes</SelectItem>
            {uniqueNomes.map((nome) => (
              <SelectItem key={nome} value={nome}>{nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={origemFilter || "all"} onValueChange={(v) => setOrigemFilter(v === "all" ? null : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as origens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {uniqueOrigens.map((key) => (
              <SelectItem key={key} value={key}>{PLATAFORMA_LABELS[key] || key}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mais_recente">Mais recentes</SelectItem>
            <SelectItem value="mais_antiga">Mais antigos</SelectItem>
            <SelectItem value="nome_az">Nome A-Z</SelectItem>
            <SelectItem value="nome_za">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')} className="gap-1">
            <List className="h-4 w-4" /> Tabela
          </Button>
          <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setView('kanban')} className="gap-1">
            <LayoutGrid className="h-4 w-4" /> Kanban
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <TooltipProvider>
          <LeadsCsvTable leads={filteredLeads} isLoading={csvLoading} onViewDetails={(id) => setSelectedLeadId(id)} />
        </TooltipProvider>
      ) : (
        <KanbanView leads={(filteredLeads || []).map(c => csvToLeadGeral(c, overrides))} onViewDetails={(id) => setSelectedLeadId(id)} />
      )}

      <LeadGeralDetailsDialog open={selectedLeadId !== null} onClose={() => setSelectedLeadId(null)} lead={selectedLead} onSaveObservacoes={handleSaveObservacoes} />
    </div>
  );
}
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

  const diasDesdeContato = lead.created_time
    ? Math.max(0, Math.floor((Date.now() - new Date(lead.created_time).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onViewDetails(lead.id)}
      >
        <div className="space-y-1.5">
          <p className="font-medium text-sm line-clamp-1">{lead.full_name || "Sem nome"}</p>

          {lead.tipo_servico && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">{lead.tipo_servico.replace(/_/g, " ")}</span>
            </div>
          )}

          {diasDesdeContato !== null && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs",
              diasDesdeContato > 7 ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>há {diasDesdeContato} {diasDesdeContato === 1 ? 'dia' : 'dias'}</span>
            </div>
          )}
        </div>
      </Card>
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
    { key: "PERDIDO", label: "Perdidos", color: "border-t-red-500" },
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
      PERDIDO: "Perdido",
    };
    const newStatus = statusMap[targetKey];
    if (!newStatus) return;

    upsertStatus.mutate({ leadCsvId: leadId, status: newStatus });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
