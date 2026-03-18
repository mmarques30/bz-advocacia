import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrazoUrgencia, PrazoTipoDistribuicao, PrazoProximoEnriquecido } from "@/hooks/useDashboardPrincipal";

interface Props {
  urgencia: PrazoUrgencia;
  distribuicao: PrazoTipoDistribuicao[];
  proximosPrazos: PrazoProximoEnriquecido[];
  loading: boolean;
  onPrazoClick?: (processoId: string) => void;
}

const TYPE_COLORS = [
  "bg-primary",
  "bg-[hsl(220,4%,40%)]",
  "bg-[hsl(142,76%,36%)]",
  "bg-[hsl(38,92%,50%)]",
  "bg-[hsl(0,84%,60%)]",
];

function getDiasBadge(dias: number) {
  if (dias === 0) return { label: "Hoje", className: "bg-[#FAEEDA] text-[hsl(38,70%,30%)] border-0" };
  if (dias <= 2) return { label: `${dias}d`, className: "bg-[#FCEBEB] text-[hsl(0,60%,35%)] border-0" };
  if (dias <= 7) return { label: `${dias}d`, className: "bg-[#EAF3DE] text-[hsl(100,40%,28%)] border-0" };
  return { label: `${dias}d`, className: "bg-muted text-muted-foreground border-0" };
}

function getBarColor(dias: number) {
  if (dias === 0) return "bg-[hsl(38,92%,50%)]";
  if (dias <= 2) return "bg-destructive";
  if (dias <= 7) return "bg-[hsl(142,76%,36%)]";
  return "bg-muted-foreground";
}

export function DashboardPrazosPanel({ urgencia, distribuicao, proximosPrazos, loading, onPrazoClick }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalUrgencia = urgencia.atrasados + urgencia.hoje + urgencia.estaSemana + urgencia.trintaDias;
  const maxTipo = Math.max(...distribuicao.map((d) => d.count), 1);

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Prazos Processuais</CardTitle>
          <button
            onClick={() => navigate("/dashboard/processos/calendario")}
            className="text-xs text-primary hover:underline font-medium"
          >
            Ver todos
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Urgency bar */}
        <div>
          <div className="flex rounded-md overflow-hidden h-9">
            {totalUrgencia > 0 ? (
              <>
                {urgencia.atrasados > 0 && (
                  <div
                    className="bg-[#FCEBEB] flex items-center justify-center gap-1 px-2"
                    style={{ width: `${(urgencia.atrasados / totalUrgencia) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-[hsl(0,60%,35%)]">{urgencia.atrasados}</span>
                    <span className="text-[10px] text-[hsl(0,60%,35%)] hidden sm:inline">Atrasados</span>
                  </div>
                )}
                {urgencia.hoje > 0 && (
                  <div
                    className="bg-[#FAEEDA] flex items-center justify-center gap-1 px-2"
                    style={{ width: `${(urgencia.hoje / totalUrgencia) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-[hsl(38,70%,30%)]">{urgencia.hoje}</span>
                    <span className="text-[10px] text-[hsl(38,70%,30%)] hidden sm:inline">Hoje</span>
                  </div>
                )}
                {urgencia.estaSemana > 0 && (
                  <div
                    className="bg-[#EAF3DE] flex items-center justify-center gap-1 px-2"
                    style={{ width: `${(urgencia.estaSemana / totalUrgencia) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-[hsl(100,40%,28%)]">{urgencia.estaSemana}</span>
                    <span className="text-[10px] text-[hsl(100,40%,28%)] hidden sm:inline">Semana</span>
                  </div>
                )}
                {urgencia.trintaDias > 0 && (
                  <div
                    className="bg-muted flex items-center justify-center gap-1 px-2"
                    style={{ width: `${(urgencia.trintaDias / totalUrgencia) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-muted-foreground">{urgencia.trintaDias}</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">30 dias</span>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-muted flex items-center justify-center w-full">
                <span className="text-xs text-muted-foreground">Nenhum prazo pendente</span>
              </div>
            )}
          </div>
        </div>

        {/* Distribution by type */}
        {distribuicao.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Por tipo</p>
            <div className="space-y-1.5">
              {distribuicao.slice(0, 5).map((d, i) => (
                <div key={d.tipo} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-24 truncate">{d.tipo}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${TYPE_COLORS[i % TYPE_COLORS.length]}`}
                      style={{ width: `${(d.count / maxTipo) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming deadlines list */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Próximos vencimentos</p>
          <div className="space-y-2">
            {proximosPrazos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum prazo próximo</p>
            )}
            {proximosPrazos.map((p) => {
              const badge = getDiasBadge(p.dias_restantes);
              const barColor = getBarColor(p.dias_restantes);
              return (
                <button
                  key={p.id}
                  onClick={() => onPrazoClick?.(p.processo_id)}
                  className="w-full flex items-center gap-2 rounded-md hover:bg-muted/50 transition-colors py-1.5 px-1 text-left"
                >
                  <div className={`w-1 h-8 rounded-full ${barColor} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.cliente_nome || p.numero_processo || "Processo"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.descricao}
                      {p.advogada_nome && ` · ${p.advogada_nome.split(" ")[0]}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 ${badge.className}`}>
                    {badge.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
