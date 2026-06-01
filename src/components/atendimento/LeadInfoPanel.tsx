import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Phone, User, Briefcase, Megaphone, Activity, CheckCircle2, XCircle, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAssumirLead } from "@/hooks/useAssumirLead";
import { ReatribuirLeadDialog } from "@/components/leads/ReatribuirLeadDialog";
import { useIsAdmin, useMeuAdvogadoId, useAdvogadosSdr } from "@/hooks/useReatribuirLead";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  leadId: string;
}

const AREAS = [
  "saude", "inventario", "sucessoes", "familia", "civel", "consumidor",
  "trabalhista", "previdenciario", "empresarial", "tributario", "consultivo", "criminal", "outra",
];

const ESTAGIOS = [
  { v: "novo", l: "Novo" },
  { v: "contato_inicial", l: "Em andamento" },
  { v: "em_analise", l: "Qualificado" },
  { v: "proposta_enviada", l: "Proposta enviada" },
  { v: "fechado", l: "Convertido" },
  { v: "perdido", l: "Perdido" },
];

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_atendimento_bot: "Bot atendendo",
  assumido_humano: "Humano",
  sql_aguardando_humano: "Qualificado",
  mql_frio: "MQL frio",
  agendado: "Agendado",
  cliente: "Cliente",
  perdido: "Perdido",
};

export function LeadInfoPanel({ leadId }: Props) {
  const qc = useQueryClient();
  const assumir = useAssumirLead({ onAssumed: () => qc.invalidateQueries({ queryKey: ["lead-info", leadId] }) });

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead-info", leadId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leads_geral")
        .select("id, full_name, phone_number, contato_whatsapp, tipo_servico, area_normalizada, origem_sdr, platform, ad_name, score, status_sdr, etapa_qualificacao, humano_responsavel, bot_pausado")
        .eq("id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: cs } = useQuery({
    queryKey: ["lead-info-cs", leadId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contact_submissions")
        .select("id, estagio, status, status_cliente")
        .eq("lead_geral_id", leadId)
        .maybeSingle();
      return data;
    },
  });

  const { data: qualif = [] } = useQuery({
    queryKey: ["lead-info-qualif", leadId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("qualificacoes_sdr")
        .select("pergunta_codigo, pergunta_texto, resposta_texto, resposta_estruturada, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Realtime: invalida quando status_sdr mudar
  useEffect(() => {
    if (!leadId) return;
    const ch = supabase
      .channel(`lead-info-${leadId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "leads_geral", filter: `id=eq.${leadId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["lead-info", leadId] });
        qc.invalidateQueries({ queryKey: ["atendimento-lead", leadId] });
        qc.invalidateQueries({ queryKey: ["atendimento-conversas"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [leadId, qc]);

  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center h-full border-l bg-card">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function updateLead(patch: Record<string, unknown>) {
    const { error } = await (supabase as any).from("leads_geral").update(patch).eq("id", leadId);
    if (error) { toast.error(error.message); return false; }
    qc.invalidateQueries({ queryKey: ["lead-info", leadId] });
    qc.invalidateQueries({ queryKey: ["atendimento-lead", leadId] });
    qc.invalidateQueries({ queryKey: ["atendimento-conversas"] });
    return true;
  }

  async function updateCs(patch: Record<string, unknown>) {
    if (!cs?.id) return true;
    const { error } = await (supabase as any).from("contact_submissions").update(patch).eq("id", cs.id);
    if (error) { toast.error(error.message); return false; }
    qc.invalidateQueries({ queryKey: ["lead-info-cs", leadId] });
    return true;
  }

  function mapAreaToTipoProcesso(a: string): string {
    const m: Record<string, string> = {
      saude: "Saúde", inventario: "Inventário", sucessoes: "Inventário",
      familia: "Família", civel: "Cível", consumidor: "Consumidor",
      trabalhista: "Trabalhista", previdenciario: "Previdenciário",
    };
    return m[a] || "Outro";
  }

  async function handleArea(area: string) {
    const ok = await updateLead({ area_normalizada: area, tipo_servico: mapAreaToTipoProcesso(area) });
    if (ok) await updateCs({ tipo_processo: mapAreaToTipoProcesso(area) });
    toast.success("Área atualizada");
  }

  async function handleEstagio(estagio: string) {
    const statusCs = estagio === "perdido" ? "perdido"
      : estagio === "fechado" ? "convertido"
      : estagio === "em_analise" ? "qualificado"
      : estagio === "novo" ? "novo" : "em_andamento";
    await updateCs({ estagio, status: statusCs });
    toast.success("Estágio atualizado");
  }

  async function marcarCliente() {
    await updateLead({ status_sdr: "cliente", bot_pausado: true });
    await updateCs({ estagio: "fechado", status: "convertido", status_cliente: "ativo" });
    toast.success("Marcado como cliente");
  }

  async function marcarPerdido() {
    await updateLead({ status_sdr: "perdido", bot_pausado: true });
    await updateCs({ estagio: "perdido", status: "fechado" });
    toast.success("Marcado como perdido");
  }

  const tel = lead.contato_whatsapp || lead.phone_number;

  return (
    <div className="flex flex-col h-full border-l bg-card overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{lead.full_name || "Sem nome"}</h3>
            {tel && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3" /> {tel}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1 border-b">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
          <Briefcase className="h-3 w-3" /> Caso
        </div>
        <div className="text-xs">{lead.tipo_servico || lead.area_normalizada || "—"}</div>
        {lead.area_normalizada && lead.tipo_servico && lead.area_normalizada !== lead.tipo_servico && (
          <div className="text-[11px] text-muted-foreground">Área normalizada: {lead.area_normalizada}</div>
        )}
      </div>

      <div className="p-4 space-y-1 border-b">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
          <Megaphone className="h-3 w-3" /> Origem
        </div>
        <div className="text-xs">{lead.origem_sdr || "—"}</div>
        <div className="text-[11px] text-muted-foreground">Plataforma: {lead.platform || "—"}</div>
        {lead.ad_name && <div className="text-[11px] text-muted-foreground">Anúncio: {lead.ad_name}</div>}
      </div>

      <div className="p-4 space-y-2 border-b">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
          <Activity className="h-3 w-3" /> Qualificação
        </div>
        <div className="flex flex-wrap gap-1">
          {lead.status_sdr && <Badge variant="secondary" className="h-5 text-[10px]">{STATUS_LABELS[lead.status_sdr] || lead.status_sdr}</Badge>}
          {lead.etapa_qualificacao && <Badge variant="outline" className="h-5 text-[10px]">{lead.etapa_qualificacao}</Badge>}
          {lead.score != null && <Badge variant="outline" className="h-5 text-[10px]">Score {lead.score}</Badge>}
          {cs?.estagio && <Badge variant="outline" className="h-5 text-[10px]">CRM: {cs.estagio}</Badge>}
        </div>
      </div>

      <div className="p-4 space-y-2 border-b">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Classificação manual</div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Área</label>
          <Select value={lead.area_normalizada || undefined} onValueChange={handleArea}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar área" /></SelectTrigger>
            <SelectContent>
              {AREAS.map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Estágio CRM</label>
          <Select value={cs?.estagio || undefined} onValueChange={handleEstagio} disabled={!cs}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={cs ? "Selecionar estágio" : "Sem registro CRM"} /></SelectTrigger>
            <SelectContent>
              {ESTAGIOS.map((e) => <SelectItem key={e.v} value={e.v} className="text-xs">{e.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 space-y-2 border-b">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Ações</div>
        {!lead.humano_responsavel && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 text-xs gap-1.5"
            disabled={assumir.isPending}
            onClick={() => assumir.mutate(leadId)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Assumir conversa
          </Button>
        )}
        <Button size="sm" variant="outline" className="w-full h-9 text-xs gap-1.5" onClick={marcarCliente}>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Marcar como cliente
        </Button>
        <Button size="sm" variant="outline" className="w-full h-9 text-xs gap-1.5" onClick={marcarPerdido}>
          <XCircle className="h-3.5 w-3.5 text-destructive" /> Marcar como perdido
        </Button>
      </div>

      <div className="p-4 space-y-2">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Respostas de qualificação</div>
        {qualif.length === 0 ? (
          <div className="text-[11px] text-muted-foreground italic">Nenhuma resposta registrada</div>
        ) : (
          <div className="space-y-2">
            {qualif.map((q: any, i: number) => {
              const est = q.resposta_estruturada || {};
              const numero = est.opcao_numero;
              const label = est.label;
              return (
                <div key={i} className="rounded border bg-muted/30 p-2 space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">{q.pergunta_codigo}</div>
                  <div className="text-[11px] text-muted-foreground">{q.pergunta_texto}</div>
                  {label ? (
                    <div className="text-xs">
                      <span className="font-medium">
                        {numero ? `${numero} - ` : ""}{label}
                      </span>
                      {q.resposta_texto && q.resposta_texto.trim() !== String(numero ?? "") && (
                        <span className="text-muted-foreground"> · "{q.resposta_texto}"</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs">{q.resposta_texto}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
