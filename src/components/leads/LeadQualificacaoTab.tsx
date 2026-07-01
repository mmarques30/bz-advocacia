import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_LABEL: Record<string, string> = {
  familia: "Família",
  inventario: "Inventário",
  saude: "Saúde",
  fora_escopo: "Fora do escopo",
  nao_identificada: "A identificar",
};

const FIELD_LABEL: Record<string, string> = {
  area: "Área",
  subtipo: "Subtipo",
  tipo: "Tipo",
  urgencia: "Urgência",
  medicamento: "Medicamento",
  tratamento: "Tratamento",
  plano: "Plano de saúde",
  operadora: "Operadora",
  valor_estimado: "Valor estimado",
  valor: "Valor",
  bens: "Bens",
  imoveis: "Imóveis",
  herdeiros: "Herdeiros",
  conjuge: "Cônjuge",
  filhos: "Filhos",
  regime: "Regime de casamento",
  tempo_uniao: "Tempo de união",
  cidade: "Cidade",
  estado: "Estado",
  motivo: "Motivo",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(formatValue).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function labelFor(k: string): string {
  return FIELD_LABEL[k] ?? k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

interface Props {
  leadGeralId: string | null | undefined;
  dadosCapturados?: Record<string, any> | null;
  area?: string | null;
  score?: number | null;
  urgencia?: string | null;
  etapa?: string | null;
  tipoServicoBot?: string | null;
}

export function LeadQualificacaoTab({
  leadGeralId,
  dadosCapturados,
  area,
  score,
  urgencia,
  etapa,
  tipoServicoBot,
}: Props) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ["qualificacoes_sdr", leadGeralId],
    enabled: !!leadGeralId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qualificacoes_sdr")
        .select("id, pergunta_codigo, pergunta_texto, resposta_texto, resposta_estruturada, created_at")
        .eq("lead_id", leadGeralId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!leadGeralId) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Este lead ainda não tem conversa registrada com a Claudia.
      </div>
    );
  }

  const dados = dadosCapturados ?? {};
  const entries = Object.entries(dados).filter(([k]) => k !== "area");

  return (
    <div className="space-y-5">
      {/* Cabeçalho: badges resumo */}
      <div className="flex flex-wrap items-center gap-2">
        {area && (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200">
            {AREA_LABEL[area] ?? area}
          </Badge>
        )}
        {typeof score === "number" && (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            Score {score}
          </Badge>
        )}
        {urgencia && (
          <Badge
            variant="outline"
            className={cn(
              urgencia === "alta" && "bg-red-50 text-red-800 border-red-200",
              urgencia === "media" && "bg-orange-50 text-orange-800 border-orange-200",
              urgencia === "baixa" && "bg-slate-50 text-slate-700 border-slate-200",
            )}
          >
            Urgência {urgencia}
          </Badge>
        )}
        {etapa && (
          <Badge variant="outline" className="bg-muted text-foreground">
            Etapa {etapa}
          </Badge>
        )}
        {tipoServicoBot && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
            {tipoServicoBot}
          </Badge>
        )}
      </div>

      {/* Dados capturados (blob acumulado) */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Dados capturados pela Claudia</h3>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada extraído ainda — a Claudia preenche este bloco automaticamente conforme o lead responde.
          </p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {entries.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{labelFor(k)}</dt>
                <dd className="text-sm break-words">{formatValue(v)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Timeline de perguntas respondidas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Linha do tempo da qualificação</h3>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !historico || historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma resposta registrada ainda.</p>
        ) : (
          <ScrollArea className="max-h-[320px] pr-3">
            <ol className="relative border-l border-border pl-4 space-y-4">
              {historico.map((h: any) => {
                const struct = (h.resposta_estruturada ?? {}) as Record<string, any>;
                const keys = Object.keys(struct);
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <div className="rounded-md border bg-background p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{h.pergunta_texto}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {h.resposta_texto && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {h.resposta_texto}
                        </p>
                      )}
                      {keys.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {keys.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]"
                            >
                              {labelFor(k)}: {formatValue(struct[k])}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </ScrollArea>
        )}
      </div>

      <Separator />
      <p className="text-[11px] text-muted-foreground">
        Score é calculado pela Claudia a cada resposta, com base na área, urgência e completude dos dados.
        A regra completa está no prompt do classificador (patch B).
      </p>
    </div>
  );
}
