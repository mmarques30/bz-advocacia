import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, MessageCircle, Send, Loader2, AlertTriangle, Pause } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { resolverAdvogadoId } from "@/lib/advogadoSdr";

interface MensagemSdr {
  id: string;
  lead_id: string;
  origem: "lead" | "bot" | "humano" | string;
  conteudo: string;
  enviada_em: string;
  metadata?: any;
}

interface Props {
  leadGeralId: string;
  // Campos opcionais do leads_geral pra regras de envio
  status_sdr?: string | null;
  bot_pausado?: boolean | null;
  // Compacto pra usar dentro de aba
  className?: string;
  autoFocus?: boolean;
  fullHeight?: boolean;
}

// Antes a regra bloqueava envio quando o bot ainda estava ativo, o que
// travava o atendimento humano em casos onde o lead voltava a conversar
// e o status_sdr nao estava em assumido_humano/agendado/cliente. A edge
// function enviar-msg-humano ja pausa o bot automaticamente no envio
// (supabase/functions/enviar-msg-humano:84-86), entao deixar a UI sempre
// permitir e seguro. O aviso visual abaixo indica quando o bot esta ativo.
const botAtivo = (status: string | null | undefined, bot_pausado: boolean | null | undefined) => {
  if (bot_pausado) return false;
  return !["assumido_humano", "agendado", "cliente", "perdido"].includes(status || "");
};

export function ConversaBot({ leadGeralId, status_sdr, bot_pausado, className, autoFocus = false, fullHeight = false }: Props) {
  const queryClient = useQueryClient();
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [autoFocus, leadGeralId]);

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ["mensagens-sdr", leadGeralId],
    // Polling 10s como fallback caso o realtime de mensagens_sdr nao
    // esteja propagando (publication missing, conexao interrompida etc).
    // O subscribe abaixo continua sendo o caminho principal.
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens_sdr" as any)
        .select("id, lead_id, origem, conteudo, enviada_em, metadata")
        .eq("lead_id", leadGeralId)
        .order("enviada_em", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as MensagemSdr[];
    },
    enabled: !!leadGeralId,
  });

  // Realtime subscribe
  useEffect(() => {
    if (!leadGeralId) return;
    const channel = supabase
      .channel(`mensagens_sdr_${leadGeralId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_sdr",
          filter: `lead_id=eq.${leadGeralId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mensagens-sdr", leadGeralId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadGeralId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens.length]);

  // Envio sempre permitido (o backend pausa o bot ao enviar). Apenas exibe
  // aviso quando o bot ainda esta ativo, pra alertar o humano que esta
  // entrando antes do tempo.
  const botEstaAtivo = botAtivo(status_sdr, bot_pausado);

  const handleEnviar = async () => {
    if (enviando) return; // guarda dura contra duplo-disparo
    const texto = mensagem.trim();
    if (!texto) return;
    setEnviando(true);
    try {
      const advogado_id = await resolverAdvogadoId();
      if (!advogado_id) throw new Error("Nenhum advogado disponível em advogados_sdr");

      const { data, error } = await supabase.functions.invoke("enviar-msg-humano", {
        body: { lead_id: leadGeralId, advogado_id, mensagem: texto },
      });
      if (error) throw error;
      if (data && data.ok === false) throw new Error("Z-API retornou erro ao enviar");
      setMensagem("");
      // Realtime propaga a mensagem real — não invalidar cache de mensagens-sdr aqui
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!enviando) handleEnviar();
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-col border rounded-lg bg-muted/20", fullHeight ? "h-full" : "h-[500px]", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando conversa...
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
            <MessageCircle className="h-10 w-10 opacity-40" />
            <p className="text-sm">Aguardando primeira interação com o lead</p>
          </div>
        ) : (
          mensagens.map((m) => {
            const isLead = m.origem === "lead";
            const isHumano = m.origem === "humano";
            return (
              <div key={m.id} className={cn("flex", isLead ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                    isLead && "bg-white border",
                    !isLead && isHumano && "bg-green-100 border border-green-200 text-green-950",
                    !isLead && !isHumano && "bg-slate-200 border border-slate-300 text-slate-900",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isLead ? (
                      <User className="h-3 w-3 text-muted-foreground" />
                    ) : isHumano ? (
                      <User className="h-3 w-3 text-green-700" />
                    ) : (
                      <Bot className="h-3 w-3 text-slate-600" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {isLead ? "Lead" : isHumano ? "Você" : "Bot"}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(m.enviada_em), "dd/MM HH:mm")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-snug">{m.conteudo}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t bg-background p-3 space-y-2">
        {botEstaAtivo && (
          <div className="flex items-start gap-2 rounded bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-900">
            <Pause className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Bot SDR ainda conversando — enviar agora vai pausar o bot e assumir o atendimento.
            </span>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          placeholder="Escreva sua resposta... (Ctrl+Enter envia)"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={onKey}
          rows={3}
          disabled={enviando}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleEnviar}
            disabled={enviando || !mensagem.trim()}
            className="gap-2"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
