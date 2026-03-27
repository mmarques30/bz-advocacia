import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { ProcessoSemMovimentacao } from "@/hooks/useDashboardPrincipal";

interface Props {
  processosSemMov: ProcessoSemMovimentacao[];
  totalSemMov: number;
  loading?: boolean;
  onProcessoClick: (id: string) => void;
}

export function DashboardSemMovimentacaoCard({ processosSemMov, totalSemMov, loading, onProcessoClick }: Props) {
  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">Sem movimentação</h3>
        {!loading && totalSemMov > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(var(--accent-amber))] text-[hsl(var(--accent-amber))]">
            {totalSemMov}
          </Badge>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : totalSemMov === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Todos os processos com movimentação recente</p>
      ) : (
        <>
          <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {totalSemMov} processo{totalSemMov > 1 ? "s" : ""} sem registro há 30+ dias
            </p>
          </div>

          <div className="space-y-1.5 flex-1">
            {processosSemMov.slice(0, 5).map(p => (
              <button
                key={p.id}
                onClick={() => onProcessoClick(p.id)}
                className="w-full flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {p.numero_processo || "Sem número"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {[p.autor, p.reu].filter(Boolean).join(" × ") || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {p.dias_sem_atualizacao > 900 ? "Nunca" : `${p.dias_sem_atualizacao}d`}
                </span>
              </button>
            ))}
          </div>

          {totalSemMov > 5 && (
            <Link to="/dashboard/processos" className="text-xs text-primary font-medium mt-2 hover:underline">
              Ver todos ({totalSemMov}) →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
