import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DistribuicaoMembro } from "@/hooks/useDashboardPrincipal";

interface Props {
  membros: DistribuicaoMembro[];
  loading?: boolean;
}

function BarRow({ nome, iniciais, valor, max, cor }: { nome: string; iniciais: string; valor: number; max: number; cor: string }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
        {iniciais}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground truncate">{nome}</p>
        <div className="h-2 bg-muted rounded-full mt-0.5 overflow-hidden">
          <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground w-6 text-right">{valor}</span>
    </div>
  );
}

export function DashboardDistribuicaoCard({ membros, loading }: Props) {
  const maxProcessos = Math.max(...membros.map(m => m.processos), 1);
  const maxTarefas = Math.max(...membros.map(m => m.tarefas), 1);

  return (
    <div className="bg-card border rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição por responsável</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : membros.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum membro com atribuições</p>
      ) : (
        <>
          {/* Processos */}
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Processos</p>
          <div className="space-y-2 mb-4">
            {membros.filter(m => m.processos > 0).map(m => (
              <BarRow key={`p-${m.id}`} nome={m.nome} iniciais={m.iniciais} valor={m.processos} max={maxProcessos} cor="bg-primary" />
            ))}
          </div>

          <div className="border-t border-border my-2" />

          {/* Tarefas */}
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Tarefas ativas</p>
          <div className="space-y-2">
            {membros.filter(m => m.tarefas > 0).map(m => (
              <div key={`t-${m.id}`} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {m.iniciais}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground truncate">{m.nome}</p>
                  <div className="h-2 bg-muted rounded-full mt-0.5 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.max((m.tarefas / maxTarefas) * 100, 4)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground w-6 text-right">{m.tarefas}</span>
                {m.tarefasUrgentes > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">{m.tarefasUrgentes} urg.</Badge>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
