import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { PrazoUrgencia, PrazoProximoEnriquecido } from "@/hooks/useDashboardPrincipal";

interface Props {
  urgencia: PrazoUrgencia;
  proximosPrazos: PrazoProximoEnriquecido[];
  loading?: boolean;
  onPrazoClick: (processoId: string) => void;
}

function diasBadge(dias: number) {
  if (dias === 0) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Hoje</Badge>;
  if (dias < 0) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{Math.abs(dias)}d atrás</Badge>;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dias <= 3 ? "border-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" : "border-border text-muted-foreground"}`}>
      {dias}d
    </Badge>
  );
}

function dotColor(dias: number) {
  if (dias < 0) return "bg-destructive";
  if (dias === 0) return "bg-[hsl(38,92%,50%)]";
  if (dias <= 7) return "bg-[hsl(142,76%,36%)]";
  return "bg-muted-foreground";
}

export function DashboardPrazosCard({ urgencia, proximosPrazos, loading, onPrazoClick }: Props) {
  return (
    <div className="bg-card border rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Prazos processuais</h3>

      {/* 2x2 urgency grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border border rounded-lg mb-4">
        <UrgencyCell label="Atrasados" value={urgencia.atrasados} color="text-destructive" loading={loading} />
        <UrgencyCell label="Vencem hoje" value={urgencia.hoje} color="text-[hsl(38,92%,50%)]" loading={loading} />
        <UrgencyCell label="Esta semana" value={urgencia.estaSemana} color="text-[hsl(142,76%,36%)]" loading={loading} />
        <UrgencyCell label="Próx. 30 dias" value={urgencia.trintaDias} color="text-muted-foreground" loading={loading} />
      </div>

      {/* Next deadlines */}
      <h4 className="text-xs font-medium text-muted-foreground mb-2">Próximos vencimentos</h4>
      <div className="flex-1 space-y-2 min-h-0 overflow-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : proximosPrazos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhum prazo próximo</p>
        ) : (
          proximosPrazos.map(p => (
            <button
              key={p.id}
              onClick={() => onPrazoClick(p.processo_id)}
              className="w-full flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor(p.dias_restantes)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {p.cliente_nome || p.numero_processo || "Processo"}
                  <span className="text-muted-foreground font-normal"> · {p.tipo_prazo}</span>
                </p>
                {p.advogada_nome && (
                  <p className="text-[10px] text-muted-foreground truncate">{p.advogada_nome}</p>
                )}
              </div>
              {diasBadge(p.dias_restantes)}
            </button>
          ))
        )}
      </div>

      <Link to="/dashboard/processos/calendario" className="text-xs text-primary font-medium mt-3 hover:underline">
        Ver calendário →
      </Link>
    </div>
  );
}

function UrgencyCell({ label, value, color, loading }: { label: string; value: number; color: string; loading?: boolean }) {
  return (
    <div className="px-3 py-3 text-center">
      {loading ? (
        <Skeleton className="h-8 w-8 mx-auto mb-1" />
      ) : (
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      )}
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
