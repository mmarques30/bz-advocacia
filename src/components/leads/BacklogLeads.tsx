import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Phone, Clock, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type BacklogRow = {
  id: string;
  telefone: string;
  telefone_raw: string | null;
  nome: string | null;
  primeira_mensagem: string | null;
  origem: string;
  status: string;
  created_at: string;
  rejeitado_motivo: string | null;
};

type TriagemRow = {
  id: string;
  telefone: string;
  telefone_digits: string;
  nome_capturado: string | null;
  msg_recebida: string;
  motivo: string;
  lead_existente_id: string | null;
  contact_submission_id: string | null;
  processo_id: string | null;
  resolvido: boolean;
  resolvido_em: string | null;
  created_at: string;
};

type UnifiedRow =
  | { kind: "lead_novo"; row: BacklogRow }
  | { kind: "triagem"; row: TriagemRow };

const MOTIVO_LABEL: Record<string, string> = {
  // leads_backlog.origem
  humano_iniciou: "Humano iniciou conversa",
  // backlog_triagem.motivo (mensagens recebidas que o bot detectou como caso especial)
  cliente_em_atendimento: "Cliente em atendimento",
  contato_em_andamento: "Contato em andamento",
  processo_ativo: "Processo ativo",
  duvida_classificacao: "Bot não classificou",
};

const MOTIVO_COLOR: Record<string, string> = {
  humano_iniciou: "bg-blue-100 text-blue-800 border-blue-200",
  cliente_em_atendimento: "bg-amber-100 text-amber-800 border-amber-300",
  contato_em_andamento: "bg-cyan-100 text-cyan-800 border-cyan-300",
  processo_ativo: "bg-emerald-100 text-emerald-800 border-emerald-300",
  duvida_classificacao: "bg-purple-100 text-purple-800 border-purple-300",
};

export function BacklogLeads() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"pendente" | "aprovado" | "rejeitado" | "resolvido" | "silenciados">(
    "pendente",
  );
  const [rejectTarget, setRejectTarget] = useState<BacklogRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  // Fonte 1: leads_backlog (humano iniciou conversa com numero desconhecido).
  const { data: backlogRows, isLoading: loadingBacklog } = useQuery({
    queryKey: ["leads_backlog", statusFilter],
    queryFn: async () => {
      // backlog antigo nao tem 'resolvido' — quando o filtro for "resolvido"
      // ou "silenciados", retorna vazio.
      if (statusFilter === "resolvido" || statusFilter === "silenciados") return [];
      const { data, error } = await supabase
        .from("leads_backlog")
        .select("*")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as BacklogRow[];
    },
  });

  // Fonte 2: backlog_triagem (bot detectou: cliente ja em atendimento,
  // contato com processo aberto, processo ativo, ou nao conseguiu
  // classificar). Resolvido=false aparece em "Pendente"; true em "Resolvido".
  const { data: triagemRows, isLoading: loadingTriagem } = useQuery({
    queryKey: ["backlog_triagem", statusFilter],
    queryFn: async () => {
      // "silenciados": prova social — casos em que o bot silenciou por detectar
      // cliente/contato/processo ativo nas últimas 48h (resolvido ou não).
      if (statusFilter === "silenciados") {
        const desde = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("backlog_triagem")
          .select("*")
          .in("motivo", [
            "cliente_em_atendimento",
            "cliente_existente",
            "cliente_existente_bot_silenciado",
            "contato_em_andamento",
            "processo_ativo",
          ])
          .gte("created_at", desde)
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return (data ?? []) as TriagemRow[];
      }
      // backlog_triagem so tem o conceito de "resolvido": pendentes
      // = resolvido=false; arquivados = resolvido=true. Os filtros
      // 'aprovado' / 'rejeitado' (so leads_backlog) nao se aplicam.
      if (statusFilter === "aprovado" || statusFilter === "rejeitado") return [];
      const { data, error } = await supabase
        .from("backlog_triagem")
        .select("*")
        .eq("resolvido", statusFilter === "resolvido")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as TriagemRow[];
    },
  });

  const isLoading = loadingBacklog || loadingTriagem;

  // Unifica e ordena por created_at desc.
  const rows: UnifiedRow[] = useMemo(() => {
    const a: UnifiedRow[] = (backlogRows ?? []).map((row) => ({ kind: "lead_novo", row }));
    const b: UnifiedRow[] = (triagemRows ?? []).map((row) => ({ kind: "triagem", row }));
    return [...a, ...b].sort((x, y) => {
      const dx = new Date(x.row.created_at).getTime();
      const dy = new Date(y.row.created_at).getTime();
      return dy - dx;
    });
  }, [backlogRows, triagemRows]);

  // Total pendente (soma das duas fontes) — alimenta o badge da aba.
  const { data: pendingCount } = useQuery({
    queryKey: ["leads_backlog_count", "pendente"],
    queryFn: async () => {
      const [backlogResult, triagemResult] = await Promise.all([
        supabase.from("leads_backlog").select("id", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("backlog_triagem").select("id", { count: "exact", head: true }).eq("resolvido", false),
      ]);
      return (backlogResult.count ?? 0) + (triagemResult.count ?? 0);
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("backlog_leads_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads_backlog" },
        () => {
          qc.invalidateQueries({ queryKey: ["leads_backlog"] });
          qc.invalidateQueries({ queryKey: ["leads_backlog_count"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "backlog_triagem" },
        () => {
          qc.invalidateQueries({ queryKey: ["backlog_triagem"] });
          qc.invalidateQueries({ queryKey: ["leads_backlog_count"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const aprovar = async (row: BacklogRow) => {
    setActing(row.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      // Cria lead em leads_geral (mesma estrutura usada pelo bot)
      const novoId = `sdr_wa_${Date.now()}_${row.telefone.slice(-6)}`;
      const { data: novoLead, error: errLead } = await supabase
        .from("leads_geral")
        .insert({
          id: novoId,
          full_name: row.nome ?? "Lead WhatsApp",
          phone_number: row.telefone,
          contato_whatsapp: row.telefone,
          platform: "whatsapp_organico",
          origem_sdr: "humano_iniciou",
          status_sdr: "assumido_humano",
          etapa_qualificacao: "M0",
          is_organic: true,
          bot_pausado: true,
          assumido_em: new Date().toISOString(),
          created_time: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (errLead) throw errLead;

      // Registra a primeira mensagem (humano) no histórico
      if (row.primeira_mensagem) {
        await supabase.from("mensagens_sdr").insert({
          lead_id: novoLead.id,
          origem: "humano",
          conteudo: row.primeira_mensagem,
          metadata: { telefone: row.telefone, via: "backlog_aprovado" },
        });
      }

      const { error: errUpd } = await supabase
        .from("leads_backlog")
        .update({
          status: "aprovado",
          aprovado_por: userId,
          aprovado_em: new Date().toISOString(),
          lead_geral_id: novoLead.id,
        })
        .eq("id", row.id);

      if (errUpd) throw errUpd;

      toast.success("Lead aprovado e cadastrado");
      qc.invalidateQueries({ queryKey: ["leads_backlog"] });
      qc.invalidateQueries({ queryKey: ["leads_backlog_count"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aprovar");
    } finally {
      setActing(null);
    }
  };

  const rejeitar = async () => {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("leads_backlog")
        .update({
          status: "rejeitado",
          aprovado_por: userData.user?.id ?? null,
          aprovado_em: new Date().toISOString(),
          rejeitado_motivo: rejectReason || null,
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;
      toast.success("Entrada rejeitada");
      setRejectTarget(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["leads_backlog"] });
      qc.invalidateQueries({ queryKey: ["leads_backlog_count"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao rejeitar");
    } finally {
      setActing(null);
    }
  };

  const resolverTriagem = async (row: TriagemRow) => {
    setActing(row.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("backlog_triagem")
        .update({
          resolvido: true,
          resolvido_em: new Date().toISOString(),
          resolvido_por: userData.user?.id ?? null,
        })
        .eq("id", row.id);
      if (error) throw error;
      toast.success("Marcado como resolvido");
      qc.invalidateQueries({ queryKey: ["backlog_triagem"] });
      qc.invalidateQueries({ queryKey: ["leads_backlog_count"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao resolver");
    } finally {
      setActing(null);
    }
  };

  const renderMotivoBadge = (chave: string) => (
    <Badge variant="outline" className={`text-[10px] ${MOTIVO_COLOR[chave] ?? ""}`}>
      {MOTIVO_LABEL[chave] ?? chave}
    </Badge>
  );

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Inbox className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Backlog de Leads</p>
            <p className="text-muted-foreground text-xs mt-1">
              Mensagens que precisam de revisão humana: humano iniciou conversa com número
              desconhecido, ou o bot detectou cliente já em atendimento, processo ativo, ou
              mensagem que não aparenta ser lead.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        {(["pendente", "aprovado", "rejeitado", "resolvido"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s}
            {s === "pendente" && pendingCount ? (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
                {pendingCount}
              </Badge>
            ) : null}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum item {statusFilter}.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((entry) => {
            const r = entry.row;
            const nome = entry.kind === "lead_novo" ? (r as BacklogRow).nome : (r as TriagemRow).nome_capturado;
            const msg =
              entry.kind === "lead_novo"
                ? (r as BacklogRow).primeira_mensagem
                : (r as TriagemRow).msg_recebida;
            const motivoChave =
              entry.kind === "lead_novo"
                ? (r as BacklogRow).origem
                : (r as TriagemRow).motivo;

            return (
              <Card key={`${entry.kind}-${r.id}`} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{nome ?? "Sem nome"}</span>
                      <Badge variant="outline" className="text-xs">
                        <Phone className="h-3 w-3 mr-1" />
                        {r.telefone}
                      </Badge>
                      {renderMotivoBadge(motivoChave)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {msg && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded border-l-2 border-primary/40 whitespace-pre-wrap">
                        {msg}
                      </p>
                    )}
                    {entry.kind === "lead_novo" && (r as BacklogRow).rejeitado_motivo && (
                      <p className="text-xs text-destructive mt-2">
                        Motivo: {(r as BacklogRow).rejeitado_motivo}
                      </p>
                    )}
                  </div>

                  {/* Ações: leads_backlog pendente -> Aprovar/Rejeitar.
                      backlog_triagem pendente (resolvido=false) -> Marcar resolvido. */}
                  {statusFilter === "pendente" && entry.kind === "lead_novo" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => aprovar(r as BacklogRow)}
                        disabled={acting === r.id}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectTarget(r as BacklogRow)}
                        disabled={acting === r.id}
                      >
                        <X className="h-4 w-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  )}
                  {statusFilter === "pendente" && entry.kind === "triagem" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolverTriagem(r as TriagemRow)}
                        disabled={acting === r.id}
                      >
                        <Check className="h-4 w-4 mr-1" /> Marcar resolvido
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar entrada do backlog</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {rejectTarget?.nome ?? "Sem nome"} — {rejectTarget?.telefone}
          </p>
          <Textarea
            placeholder="Motivo (opcional): spam, número errado, conversa pessoal..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={rejeitar} disabled={!!acting}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
