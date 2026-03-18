import { Skeleton } from "@/components/ui/skeleton";

interface DashboardKPICardProps {
  title: string;
  value: number;
  barColor: string; // tailwind bg class
  subtitle?: string;
  loading?: boolean;
}

export function DashboardKPICard({ title, value, barColor, subtitle, loading }: DashboardKPICardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg flex overflow-hidden">
      <div className={`w-1.5 ${barColor} shrink-0`} />
      <div className="p-4 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-seasons font-bold text-foreground mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
