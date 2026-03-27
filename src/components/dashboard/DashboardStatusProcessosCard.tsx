import { Skeleton } from "@/components/ui/skeleton";
import type { StatusProcessos } from "@/hooks/useDashboardPrincipal";

interface Props {
  statusProcessos: StatusProcessos;
  processosSemMov?: unknown[];
  totalSemMov?: number;
  loading?: boolean;
  onProcessoClick?: (id: string) => void;
}

export function DashboardStatusProcessosCard({ statusProcessos, loading }: Props) {
  return (
    <div className="bg-card border rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">Status dos processos</h3>
      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 flex-1" />)}
        </div>
      ) : (
        <div className="flex gap-2">
          <StatusBlock label="Em andamento" value={statusProcessos.emAndamento} variant="primary" />
          <StatusBlock label="Concluídos" value={statusProcessos.concluidos} variant="green" />
          <StatusBlock label="Arquivados" value={statusProcessos.arquivados} variant="muted" />
        </div>
      )}
    </div>
  );
}

function StatusBlock({ label, value, variant }: { label: string; value: number; variant: "primary" | "green" | "muted" }) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-700 dark:text-green-400",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className={`flex-1 rounded-lg px-3 py-3 text-center ${styles[variant]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] opacity-80">{label}</p>
    </div>
  );
}
