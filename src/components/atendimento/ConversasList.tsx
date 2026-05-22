import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STATUS_HUMANO = ["assumido_humano", "sql_aguardando_humano", "agendado", "cliente"];
const STATUS_BOT = ["novo", "em_atendimento_bot"];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  novo: { label: "Novo", cls: "bg-blue-100 text-blue-800" },
  em_atendimento_bot: { label: "Bot", cls: "bg-amber-100 text-amber-800" },
  assumido_humano: { label: "Humano", cls: "bg-green-100 text-green-800" },
  sql_aguardando_humano: { label: "Qualificado", cls: "bg-emerald-100 text-emerald-800" },
  agendado: { label: "Agendado", cls: "bg-purple-100 text-purple-800" },
  cliente: { label: "Cliente", cls: "bg-emerald-100 text-emerald-800" },
  perdido: { label: "Perdido", cls: "bg-gray-100 text-gray-700" },
  mql_frio: { label: "MQL frio", cls: "bg-gray-100 text-gray-700" },
};

export function ConversasList({ selectedId, onSelect }: Props) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"minhas" | "todas">("minhas");
  const [tipo, setTipo] = useState<"todos" | "bot" | "humano">("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<"recentes" | "prazo">("recentes");
  const [meuAdvogadoId, setMeuAdvogadoId] = useState<string | null>(null);

  useEffect(() => {
    resolverAdvogadoId().then(setMeuAdvogadoId);
  }, []);

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ["atendimento-conversas", filtro, tipo, statusFiltro, ordenacao, meuAdvogadoId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("leads_geral")
        .select("id, full_name, phone_number, ultima_mensagem_em, ultima_leitura_humano, humano_responsavel, status_sdr")
        .order("ultima_mensagem_em", { ascending: ordenacao === "prazo", nullsFirst: false })
        .limit(200);

      if (tipo === "humano") {
        q = q.not("humano_responsavel", "is", null).in("status_sdr", STATUS_HUMANO);
      } else if (tipo === "bot") {
        q = q.in("status_sdr", STATUS_BOT);
      } else {
        // todos — exige ao menos status_sdr setado (lead do bot ou humano)
        q = q.not("status_sdr", "is", null);
      }

      if (filtro === "minhas" && meuAdvogadoId) {
        q = q.eq("humano_responsavel", meuAdvogadoId);
      }

      if (statusFiltro !== "todos") {
        q = q.eq("status_sdr", statusFiltro);
      }

      const { data, error } = await q;
      if (error) throw error;
      const leads = (data || []) as ConversaItem[];

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

  useEffect(() => {
    const channel = supabase
      .channel("atendimento-mensagens-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens_sdr" }, () => {
        queryClient.invalidateQueries({ queryKey: ["atendimento-conversas"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads_geral" }, () => {
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
        <div className="grid grid-cols-3 gap-1.5">
          <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">Todos</SelectItem>
              <SelectItem value="bot" className="text-xs">Bot</SelectItem>
              <SelectItem value="humano" className="text-xs">Humano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">Qualquer status</SelectItem>
              <SelectItem value="novo" className="text-xs">Novo</SelectItem>
              <SelectItem value="em_atendimento_bot" className="text-xs">Bot atendendo</SelectItem>
              <SelectItem value="assumido_humano" className="text-xs">Em andamento</SelectItem>
              <SelectItem value="sql_aguardando_humano" className="text-xs">Qualificado</SelectItem>
              <SelectItem value="cliente" className="text-xs">Cliente</SelectItem>
              <SelectItem value="perdido" className="text-xs">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as any)}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes" className="text-xs">Recentes</SelectItem>
              <SelectItem value="prazo" className="text-xs">Prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            const badge = c.status_sdr ? STATUS_BADGE[c.status_sdr] : null;
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
                <div className="flex items-center gap-1.5">
                  {badge && (
                    <Badge className={cn("h-4 px-1 text-[9px] font-normal border-0", badge.cls)}>
                      {badge.label}
                    </Badge>
                  )}
                  {!isMinha && filtro === "todas" && c.humano_responsavel && (
                    <span className="text-[10px] text-muted-foreground italic">outro atendente</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
