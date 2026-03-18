import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { LeadsFunil, LeadPendente } from "@/hooks/useDashboardPrincipal";

interface Props {
  funil: LeadsFunil;
  semFollowUp: LeadPendente[];
  taxaConversao: number;
  loading?: boolean;
}

const funilCells: { key: keyof LeadsFunil; label: string }[] = [
  { key: "novo", label: "Novo" },
  { key: "em_contato", label: "Em contato" },
  { key: "proposta", label: "Proposta" },
  { key: "perdido", label: "Perdido" },
];

export function DashboardLeadsPendentesCard({ funil, semFollowUp, taxaConversao, loading }: Props) {
  return (
    <div className="bg-card border rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Leads pendentes</h3>

      {/* Funnel */}
      {loading ? (
        <Skeleton className="h-16 w-full mb-3" />
      ) : (
        <div className="grid grid-cols-4 divide-x divide-border border rounded-lg mb-4">
          {funilCells.map(c => (
            <div key={c.key} className="px-2 py-2 text-center">
              <p className="text-lg font-bold text-foreground">{funil[c.key]}</p>
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sem follow-up */}
      <h4 className="text-xs font-medium text-muted-foreground mb-2">Sem follow-up recente</h4>
      <div className="flex-1 space-y-1.5 min-h-0 overflow-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : semFollowUp.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Todos os leads estão em dia</p>
        ) : (
          semFollowUp.map(l => (
            <div key={l.id} className="flex items-center gap-2 px-2 py-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{l.nome}</p>
                <p className="text-[10px] text-muted-foreground">{l.origem || "Site"}</p>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]">
                {l.dias_parado}d parado
              </Badge>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-3 pt-2 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Conversão do mês: <span className="font-semibold text-foreground">{taxaConversao}%</span>
        </p>
        <Link to="/dashboard/leads" className="text-xs text-primary font-medium hover:underline">
          Ver todos →
        </Link>
      </div>
    </div>
  );
}
