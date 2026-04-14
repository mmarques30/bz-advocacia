import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICell {
  title: string;
  value: number | string;
  subtitle: ReactNode;
  accentColor: string;
  valueColor?: string;
}

interface Props {
  cells: KPICell[];
  loading?: boolean;
}

export function DashboardKPIStripV2({ cells, loading }: Props) {
  return (
    <div className="flex border rounded-xl bg-card divide-x divide-border overflow-hidden">
      {cells.map((cell, i) => (
        <div key={i} className="flex-1 min-w-0 relative">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: cell.accentColor }}
          />
          {loading ? (
            <div className="px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <div className="px-4 py-3 pt-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {cell.title}
              </p>
              <p
                className="text-2xl font-bold leading-tight mt-0.5"
                style={{ color: cell.valueColor || "hsl(var(--foreground))" }}
              >
                {cell.value}
              </p>
              <div className="text-xs mt-0.5 truncate text-muted-foreground">
                {cell.subtitle}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
