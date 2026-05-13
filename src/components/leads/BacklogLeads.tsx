import { useEffect, useState } from "react";
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

export function BacklogLeads() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"pendente" | "aprovado" | "rejeitado">(
    "pendente",
  );
  const [rejectTarget, setRejectTarget] = useState<BacklogRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["leads_backlog", statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_backlog")
        .select("*")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as BacklogRow[];
    },
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["leads_backlog_count", "pendente"],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads_backlog")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente");
      return count ?? 0;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("leads_backlog_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads_backlog" },
        () => {
          qc.invalidateQueries({ queryKey: ["leads_backlog"] });
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

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Inbox className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Backlog de Leads</p>
            <p className="text-muted-foreground text-xs mt-1">
              Quando alguém do Time B&Z inicia uma conversa pelo WhatsApp com um número
              desconhecido, o contato vai pra cá. Aprove para virar lead no sistema, ou
              rejeite (spam, número errado, conversa pessoal etc).
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        {(["pendente", "aprovado", "rejeitado"] as const).map((s) => (
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
      ) : !rows || rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum item {statusFilter}.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{row.nome ?? "Sem nome"}</span>
                    <Badge variant="outline" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {row.telefone}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{row.origem}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(row.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {row.primeira_mensagem && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded border-l-2 border-primary/40 whitespace-pre-wrap">
                      {row.primeira_mensagem}
                    </p>
                  )}
                  {row.rejeitado_motivo && (
                    <p className="text-xs text-destructive mt-2">
                      Motivo: {row.rejeitado_motivo}
                    </p>
                  )}
                </div>
                {statusFilter === "pendente" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => aprovar(row)}
                      disabled={acting === row.id}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectTarget(row)}
                      disabled={acting === row.id}
                    >
                      <X className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
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
