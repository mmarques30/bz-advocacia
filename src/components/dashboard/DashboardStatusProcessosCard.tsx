import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { StatusProcessos, ProcessoSemMovimentacao } from "@/hooks/useDashboardPrincipal";

interface Props {
  statusProcessos: StatusProcessos;
  processosSemMov: ProcessoSemMovimentacao[];
  totalSemMov: number;
  loading?: boolean;
  onProcessoClick: (id: string) => void;
}

export function DashboardStatusProcessosCard({ statusProcessos, processosSemMov, totalSemMov, loading, onProcessoClick }: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status card */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Status dos processos</h3>
        {loading ? (
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 flex-1" />)}
          </div>
        ) : (
          <div className="flex gap-2">
            <StatusBlock label="Em andamento" value={statusProcessos.emAndamento} bg="bg-blue-50" text="text-blue-700" />
            <StatusBlock label="Concluídos" value={statusProcessos.concluidos} bg="bg-green-50" text="text-green-700" />
            <StatusBlock label="Arquivados" value={statusProcessos.arquivados} bg="bg-muted" text="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Sem movimentação card */}
      <div className="bg-card border rounded-xl p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Sem movimentação</h3>
          {!loading && totalSemMov > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]">
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
            <div className="flex items-center gap-2 bg-[hsl(38,92%,50%)]/10 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[hsl(38,92%,50%)]" />
              <p className="text-xs text-[hsl(38,92%,50%)]">
                {totalSemMov} processo{totalSemMov > 1 ? "s" : ""} sem registro há 30+ dias
              </p>
            </div>

            <div className="space-y-1.5 flex-1">
              {processosSemMov.map(p => (
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

            <Link to="/dashboard/processos" className="text-xs text-primary font-medium mt-2 hover:underline">
              Ver todos →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBlock({ label, value, bg, text }: { label: string; value: number; bg: string; text: string }) {
  return (
    <div className={`flex-1 rounded-lg px-3 py-3 text-center ${bg}`}>
      <p className={`text-xl font-bold ${text}`}>{value}</p>
      <p className={`text-[10px] ${text} opacity-80`}>{label}</p>
    </div>
  );
}
