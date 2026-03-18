import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import type { TarefaUrgente } from "@/hooks/useDashboardPrincipal";
import type { Demanda } from "@/types/demandas";

interface Props {
  tarefas: TarefaUrgente[];
  loading?: boolean;
  onTarefaClick: (tarefa: TarefaUrgente) => void;
}

const prioridadeConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  urgente: { label: "Urgente", className: "bg-destructive/10 text-destructive border-destructive/20", dotColor: "bg-destructive" },
  alta: { label: "Alta", className: "bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]/20", dotColor: "bg-[hsl(38,92%,50%)]" },
  media: { label: "Média", className: "bg-blue-50 text-blue-600 border-blue-200", dotColor: "bg-blue-500" },
};

export function DashboardTarefasUrgentesCard({ tarefas, loading, onTarefaClick }: Props) {
  return (
    <div className="bg-card border rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Tarefas urgentes</h3>

      <div className="flex-1 space-y-2 min-h-0 overflow-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : tarefas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma tarefa urgente no momento</p>
        ) : (
          tarefas.map(t => {
            const cfg = prioridadeConfig[t.prioridade] || prioridadeConfig.media;
            return (
              <button
                key={t.id}
                onClick={() => onTarefaClick(t)}
                className="w-full flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-2 py-2 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{t.titulo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {t.responsavel_nome || t.advogada_responsavel}
                    {t.data_limite && ` · ${format(parseISO(t.data_limite), "dd/MM")}`}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${cfg.className}`}>
                  {cfg.label}
                </Badge>
              </button>
            );
          })
        )}
      </div>

      <Link to="/dashboard/processos/demandas" className="text-xs text-primary font-medium mt-3 hover:underline">
        Ver todas →
      </Link>
    </div>
  );
}
