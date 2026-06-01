import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, LayoutGrid, List, Table2, ArrowUpDown, Clock, Briefcase, Zap, Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { useSdrAlerts } from "@/hooks/useSdrAlerts";
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

// Leads (contact_submissions)
import { useLeads } from "@/hooks/useLeads";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsOrganicSummary } from "@/components/leads/LeadsOrganicSummary";
import { BacklogLeads } from "@/components/leads/BacklogLeads";
import { Lead, LeadsFilters as FiltersType } from "@/types/leads";
import { useQuery } from "@tanstack/react-query";

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

// Filters specifically for ads leads tab
const adsDefaultFilters: FiltersType = {
  ...defaultFilters,
  status: [], // show all statuses for ads leads
};

export default function Leads() {
  const [activeTab, setActiveTab] = useState("leads");

  const { data: backlogPending } = useQuery({
    queryKey: ["leads_backlog_count", "pendente"],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads_backlog")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Gestão de Leads</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads manuais e de anúncios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leads">Leads Orgânicos</TabsTrigger>
          <TabsTrigger value="anuncios">Leads Anúncios</TabsTrigger>
          <TabsTrigger value="backlog" className="relative">
            Backlog de Leads
            {backlogPending ? (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1">
                {backlogPending}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadsTab filterOrigins={null} excludeOrigins={['facebook', 'instagram', 'meta', 'tiktok', 'linkedin', 'google']} />
        </TabsContent>

        <TabsContent value="anuncios">
          <LeadsTab filterOrigins={['facebook', 'instagram', 'meta', 'tiktok', 'linkedin', 'google']} excludeOrigins={null} isAdsTab />
        </TabsContent>

        <TabsContent value="backlog">
          <BacklogLeads />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================== Unified Leads Tab =====================
function LeadsTab({ 
  filterOrigins, 
  excludeOrigins, 
  isAdsTab = false 
}: { 
  filterOrigins: string[] | null; 
  excludeOrigins: string[] | null;
  isAdsTab?: boolean;
}) {
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersType>(isAdsTab ? adsDefaultFilters : defaultFilters);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [nomeFilter, setNomeFilter] = useState<string | null>(null);
  const [origemFilter, setOrigemFilter] = useState<string | null>(null);
  const [origemTipo, setOrigemTipo] = useState<"todas" | "organicos" | "ctwa" | "campanha">("todas");
  const [nomes, setNomes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("mais_recente");

  const handleAssumed = (lead: Lead) => {
    setInitialTab("conversa-bot");
    setSelectedLead(lead);
  };

  useEffect(() => {
    const fetchNomes = async () => {
      let query = supabase
        .from('contact_submissions')
        .select('nome_completo')
        .order('nome_completo');
      
      if (filterOrigins) {
        query = query.in('origem', filterOrigins);
      }
      if (excludeOrigins) {
        for (const o of excludeOrigins) {
          query = query.neq('origem', o);
        }
      }
      if (!isAdsTab) {
        query = query.neq('estagio', 'fechado');
      }

      const { data } = await query;
      if (data) setNomes([...new Set(data.map(d => d.nome_completo).filter((n): n is string => !!n && n.trim() !== ''))]);
    };
    fetchNomes();
  }, [filterOrigins, excludeOrigins, isAdsTab]);

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

  // Use the standard useLeads hook, which queries contact_submissions
  const { data: leads, isLoading } = useLeads(queryFilters);

  // Filter by origin (ads vs organic) client-side
  const originFilteredLeads = useMemo(() => {
    if (!leads) return undefined;
    let result = leads;
    if (filterOrigins) {
      result = result.filter(l => filterOrigins.includes(l.origem || ''));
    }
    if (excludeOrigins) {
      result = result.filter(l => !excludeOrigins.includes(l.origem || ''));
    }
    return result;
  }, [leads, filterOrigins, excludeOrigins]);

  const filteredLeads = useMemo(() => {
    if (!originFilteredLeads) return undefined;
    let result = nomeFilter ? originFilteredLeads.filter(l => l.nome_completo === nomeFilter) : [...originFilteredLeads];
    result.sort((a, b) => {
      // Sempre prioriza leads quentes do bot
      const aHot = a.status_sdr === "sql_aguardando_humano" ? 1 : 0;
      const bHot = b.status_sdr === "sql_aguardando_humano" ? 1 : 0;
      if (aHot !== bHot) return bHot - aHot;
      switch (sortOrder) {
        case "mais_antiga": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "nome_az": return a.nome_completo.localeCompare(b.nome_completo);
        case "nome_za": return b.nome_completo.localeCompare(a.nome_completo);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [originFilteredLeads, nomeFilter, sortOrder]);

  const aguardandoCount = useMemo(
    () => (filteredLeads || []).filter(l => l.status_sdr === "sql_aguardando_humano").length,
    [filteredLeads],
  );

  const { soundEnabled, setSoundEnabled, notifPermission, notifEnabled, requestNotifications } =
    useSdrAlerts(filteredLeads, setSelectedLead);

  return (
    <div className="space-y-4 mt-4">
      {aguardandoCount > 0 && (
        <Card className="p-4 border-orange-300 bg-orange-50 flex items-center gap-3 animate-pulse">
          <Zap className="h-6 w-6 text-orange-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-orange-900">
              {aguardandoCount} {aguardandoCount === 1 ? "lead aguardando" : "leads aguardando"} você atender agora
            </p>
            <p className="text-xs text-orange-800">Bot já qualificou — só falta resposta humana</p>
          </div>
        </Card>
      )}

      <LeadsOrganicSummary leads={filteredLeads} loading={isLoading} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          {!isAdsTab && (
            <Button onClick={() => setNewLeadOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Lead
            </Button>
          )}

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

          {!isAdsTab && (
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
          )}

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

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="outline" onClick={() => setFiltersOpen(true)} className="relative">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">{activeFilters}</Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Som ativo" : "Som desativado"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="ml-1.5 text-xs">{soundEnabled ? "Som ativo" : "Som off"}</span>
          </Button>

          {notifPermission === "denied" ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Habilite notificações nas configurações do navegador para este site"
            >
              <BellOff className="h-4 w-4" />
              <span className="ml-1.5 text-xs">Notificações bloqueadas</span>
            </Button>
          ) : notifEnabled && notifPermission === "granted" ? (
            <Button variant="outline" size="sm" disabled title="Notificações ativas">
              <Bell className="h-4 w-4 text-green-600" />
              <span className="ml-1.5 text-xs">Notificações ativas</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={requestNotifications}>
              <Bell className="h-4 w-4" />
              <span className="ml-1.5 text-xs">Ativar notificações</span>
            </Button>
          )}

          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'table' | 'kanban')}>
            <ToggleGroupItem value="table" aria-label="Tabela"><Table2 className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <TooltipProvider>
        {view === 'table' ? (
          <LeadsTable leads={filteredLeads} isLoading={isLoading} onViewDetails={setSelectedLead} onEdit={setEditLead} enableBulkSelect={isAdsTab} onAssumed={handleAssumed} />
        ) : (
          <LeadsKanban leads={filteredLeads} isLoading={isLoading} onViewDetails={setSelectedLead} onAssumed={handleAssumed} />
        )}
      </TooltipProvider>

      <LeadsFilters open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} onFiltersChange={setFilters} />
      <NewLeadDialog open={newLeadOpen || editLead !== null} onClose={() => { setNewLeadOpen(false); setEditLead(null); }} lead={editLead} />
      <LeadDetailsDialog
        open={selectedLead !== null}
        onClose={() => { setSelectedLead(null); setInitialTab(undefined); }}
        lead={selectedLead}
        initialTab={initialTab}
        onEdit={(lead) => { setSelectedLead(null); setEditLead(lead); }}
      />
    </div>
  );
}
