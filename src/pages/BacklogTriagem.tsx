import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Check, ExternalLink, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useBacklogTriagem,
  type BacklogTriagemMotivo,
  type BacklogTriagemRow,
} from "@/hooks/useBacklogTriagem";

const MOTIVO_LABEL: Record<BacklogTriagemMotivo, string> = {
  cliente_em_atendimento: "Cliente em atendimento",
  contato_em_andamento: "Contato em andamento",
  processo_ativo: "Processo ativo",
  duvida_classificacao: "Dúvida do bot",
};

const MOTIVO_COLOR: Record<BacklogTriagemMotivo, string> = {
  cliente_em_atendimento: "bg-amber-500/15 text-amber-700 border-amber-400/40",
  contato_em_andamento: "bg-blue-500/15 text-blue-700 border-blue-400/40",
  processo_ativo: "bg-emerald-500/15 text-emerald-700 border-emerald-400/40",
  duvida_classificacao: "bg-purple-500/15 text-purple-700 border-purple-400/40",
};

export default function BacklogTriagem() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pendente" | "resolvido">("pendente");
  const [filtroMotivo, setFiltroMotivo] = useState<BacklogTriagemMotivo | "todos">("todos");
  const [acting, setActing] = useState<string | null>(null);

  const { data: rows, isLoading } = useBacklogTriagem(tab === "resolvido");

  const filtered = (rows ?? []).filter(
    (r) => filtroMotivo === "todos" || r.motivo === filtroMotivo,
  );

  const counts = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.motivo] = (acc[r.motivo] ?? 0) + 1;
    return acc;
  }, {});

  const atender = async (row: BacklogTriagemRow) => {
    setActing(row.id);
    try {
      const { data: u } = await supabase.auth.getUser();
      await supabase
        .from("backlog_triagem")
        .update({
          resolvido: true,
          resolvido_em: new Date().toISOString(),
          resolvido_por: u.user?.id ?? null,
        })
        .eq("id", row.id);

      qc.invalidateQueries({ queryKey: ["backlog_triagem"] });
      qc.invalidateQueries({ queryKey: ["backlog_triagem_count"] });
      toast.success("Marcado como resolvido");

      // Abre conversa se possível
      if (row.lead_existente_id) {
        navigate(`/dashboard/atendimento?lead=${row.lead_existente_id}`);
      } else if (row.contact_submission_id) {
        navigate(`/dashboard/leads?id=${row.contact_submission_id}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atender");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Inbox className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-seasons text-primary">Backlog de Triagem</h1>
          <p className="text-xs text-muted-foreground">
            Mensagens que o bot identificou como cliente/contato já em atendimento, ou que não conseguiu classificar.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["pendente", "resolvido"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className="capitalize h-9 text-xs"
          >
            {t}
          </Button>
        ))}

        <div className="mx-2 h-6 w-px bg-border" />

        <Button
          size="sm"
          variant={filtroMotivo === "todos" ? "default" : "outline"}
          onClick={() => setFiltroMotivo("todos")}
          className="h-9 text-xs"
        >
          Todos
        </Button>
        {(Object.keys(MOTIVO_LABEL) as BacklogTriagemMotivo[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={filtroMotivo === m ? "default" : "outline"}
            onClick={() => setFiltroMotivo(m)}
            className="h-9 text-xs"
          >
            {MOTIVO_LABEL[m]}
            {counts[m] ? (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
                {counts[m]}
              </Badge>
            ) : null}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nada {tab === "pendente" ? "pendente" : "resolvido"} no momento.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {row.nome_capturado ?? "Sem nome"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {row.telefone}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${MOTIVO_COLOR[row.motivo]}`}
                    >
                      {MOTIVO_LABEL[row.motivo]}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(row.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <p className="text-sm p-2 bg-muted rounded border-l-2 border-primary/40 whitespace-pre-wrap">
                    {row.msg_recebida}
                  </p>

                  {(row.lead_existente_id || row.contact_submission_id) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {row.lead_existente_id && (
                        <button
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          onClick={() =>
                            navigate(`/dashboard/atendimento?lead=${row.lead_existente_id}`)
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                          Lead existente
                        </button>
                      )}
                      {row.contact_submission_id && (
                        <button
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          onClick={() =>
                            navigate(`/dashboard/leads?id=${row.contact_submission_id}`)
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                          Contato no CRM
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {tab === "pendente" && (
                  <Button
                    size="sm"
                    onClick={() => atender(row)}
                    disabled={acting === row.id}
                    className="h-9 text-xs"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Atender
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
