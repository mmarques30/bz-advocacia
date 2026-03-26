import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICell {
  title: string;
  value: number;
  context: ReactNode;
  contextColor?: "destructive" | "amber" | "green" | "muted";
  contextLink?: string;
}

interface Props {
  cells: KPICell[];
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  destructive: "text-destructive",
  amber: "text-[hsl(38,92%,50%)]",
  green: "text-[hsl(142,76%,36%)]",
  muted: "text-muted-foreground",
};

export function DashboardKPIStrip({ cells, loading }: Props) {
  return (
    <div className="flex border rounded-xl bg-card divide-x divide-border overflow-hidden">
      {cells.map((cell, i) => (
        <div key={i} className="flex-1 px-4 py-3 min-w-0">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {cell.title}
              </p>
              <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">
                {cell.value}
              </p>
              <div className={`text-xs mt-0.5 truncate ${colorMap[cell.contextColor || "muted"]}`}>
                {cell.context}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
