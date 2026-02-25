import { useState } from "react";
import { LeadsCsvTable } from "@/components/leads/LeadsCsvTable";
import { LeadsCsvSummary } from "@/components/leads/LeadsCsvSummary";
import { LeadGeralDetailsDialog } from "@/components/leads/LeadGeralDetailsDialog";
import { useLeadsCsv, CsvLead } from "@/hooks/useLeadsCsv";
import { useLeadsGeral, LeadGeral } from "@/hooks/useLeadsGeral";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List } from "lucide-react";

function csvToLeadGeral(csv: CsvLead): LeadGeral {
  // Convert DD/MM/YYYY to ISO
  let createdTime: string | null = null;
  if (csv.dataRaw) {
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
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: csvData, isLoading: csvLoading } = useLeadsCsv();
  const { data: leadsGeral, updateObservacoes } = useLeadsGeral();

  const selectedCsv = csvData?.leads?.find(l => l.id === selectedLeadId);
  const selectedLead: LeadGeral | null = selectedCsv ? csvToLeadGeral(selectedCsv) : null;

  // Filter leads by search
  const filteredLeads = csvData?.leads?.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.nome.toLowerCase().includes(q) || l.telefone.includes(q);
  });

  const handleSaveObservacoes = (id: string, obs: string) => {
    updateObservacoes.mutate({ id, observacoes: obs });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Vendas</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e oportunidades de vendas
        </p>
      </div>

      <LeadsCsvSummary summary={csvData?.summary} loading={csvLoading} />

      {/* Header com busca e toggle */}
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
          leads={leadsGeral || []}
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

// Simple Kanban view for leads_geral
function KanbanView({ leads, onViewDetails }: { leads: LeadGeral[]; onViewDetails: (id: string) => void }) {
  const columns = [
    { key: "CREATED", label: "Novos", color: "border-t-blue-500" },
    { key: "ENVIADO", label: "Enviados", color: "border-t-green-500" },
    { key: "QUALIFICADO", label: "Qualificados", color: "border-t-purple-500" },
    { key: "CONVERTIDO", label: "Convertidos", color: "border-t-emerald-500" },
  ];

  const grouped = columns.map(col => ({
    ...col,
    leads: leads.filter(l => (l.lead_status || "").toUpperCase() === col.key),
  }));

  // Leads that don't match any column
  const knownKeys = columns.map(c => c.key);
  const others = leads.filter(l => !knownKeys.includes((l.lead_status || "").toUpperCase()));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {grouped.map((col) => (
        <div key={col.key} className={`border rounded-lg ${col.color} border-t-4 bg-muted/30`}>
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">{col.label}</h3>
            <span className="text-xs text-muted-foreground">{col.leads.length} leads</span>
          </div>
          <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
            {col.leads.map(lead => (
              <div
                key={lead.id}
                className="bg-background border rounded-md p-3 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onViewDetails(lead.id)}
              >
                <p className="font-medium text-sm truncate">{lead.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground truncate">{lead.phone_number?.replace("p:", "")}</p>
                {lead.tipo_servico && (
                  <p className="text-xs text-muted-foreground mt-1">{lead.tipo_servico.replace(/_/g, " ")}</p>
                )}
              </div>
            ))}
            {col.leads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>
            )}
          </div>
        </div>
      ))}
      {others.length > 0 && (
        <div className="border rounded-lg border-t-4 border-t-gray-400 bg-muted/30">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Outros</h3>
            <span className="text-xs text-muted-foreground">{others.length} leads</span>
          </div>
          <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
            {others.map(lead => (
              <div
                key={lead.id}
                className="bg-background border rounded-md p-3 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onViewDetails(lead.id)}
              >
                <p className="font-medium text-sm truncate">{lead.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground truncate">{lead.phone_number?.replace("p:", "")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
