import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageCircle, Search } from "lucide-react";
import { resolverAdvogadoId } from "@/lib/advogadoSdr";

interface ConversaItem {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  ultima_mensagem_em: string | null;
  ultima_leitura_humano: string | null;
  humano_responsavel: string | null;
  status_sdr: string | null;
  preview?: string | null;
  unread?: number;
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversasList({ selectedId, onSelect }: Props) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"minhas" | "todas">("minhas");
  const [meuAdvogadoId, setMeuAdvogadoId] = useState<string | null>(null);

  useEffect(() => {
    resolverAdvogadoId().then(setMeuAdvogadoId);
  }, []);

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ["atendimento-conversas", filtro, meuAdvogadoId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("leads_geral")
        .select("id, full_name, phone_number, ultima_mensagem_em, ultima_leitura_humano, humano_responsavel, status_sdr")
        .not("humano_responsavel", "is", null)
        .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })
        .limit(200);

      if (filtro === "minhas" && meuAdvogadoId) {
        q = q.eq("humano_responsavel", meuAdvogadoId);
      }
      const { data, error } = await q;
      if (error) throw error;
      const leads = (data || []) as ConversaItem[];

      // Buscar prévia da última mensagem + count de não lidas em paralelo
      const enriched = await Promise.all(
        leads.map(async (lead) => {
          const { data: ultima } = await (supabase as any)
            .from("mensagens_sdr")
            .select("conteudo")
            .eq("lead_id", lead.id)
            .order("enviada_em", { ascending: false })
            .limit(1)
            .maybeSingle();

          let unread = 0;
          if (lead.ultima_leitura_humano) {
            const { count } = await (supabase as any)
              .from("mensagens_sdr")
              .select("id", { count: "exact", head: true })
              .eq("lead_id", lead.id)
              .eq("origem", "lead")
              .gt("enviada_em", lead.ultima_leitura_humano);
            unread = count || 0;
          } else {
            const { count } = await (supabase as any)
              .from("mensagens_sdr")
              .select("id", { count: "exact", head: true })
              .eq("lead_id", lead.id)
              .eq("origem", "lead");
            unread = count || 0;
          }

          return { ...lead, preview: ultima?.conteudo || null, unread };
        })
      );

      return enriched;
    },
    enabled: filtro === "todas" || !!meuAdvogadoId,
    refetchInterval: 30000,
  });

  // Realtime: invalidar lista quando chegar nova mensagem
  useEffect(() => {
    const channel = supabase
      .channel("atendimento-mensagens-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens_sdr" }, () => {
        queryClient.invalidateQueries({ queryKey: ["atendimento-conversas"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return conversas;
    return conversas.filter(
      (c) =>
        (c.full_name || "").toLowerCase().includes(termo) ||
        (c.phone_number || "").includes(termo)
    );
  }, [conversas, busca]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r bg-card">
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="h-9 text-xs pl-7"
          />
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="minhas" className="text-xs">Minhas</TabsTrigger>
            <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2 text-muted-foreground p-4">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-xs">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filtradas.map((c) => {
            const isSelected = c.id === selectedId;
            const isMinha = c.humano_responsavel === meuAdvogadoId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors flex flex-col gap-0.5",
                  isSelected && "bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">
                    {c.full_name || c.phone_number || "Sem nome"}
                  </span>
                  {c.ultima_mensagem_em && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(c.ultima_mensagem_em), { locale: ptBR, addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground truncate flex-1">
                    {c.preview || "—"}
                  </span>
                  {(c.unread || 0) > 0 && (
                    <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px] rounded-full">
                      {c.unread}
                    </Badge>
                  )}
                </div>
                {!isMinha && filtro === "todas" && (
                  <span className="text-[10px] text-muted-foreground italic">outro atendente</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
