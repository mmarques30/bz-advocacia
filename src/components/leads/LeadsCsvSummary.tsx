import { Users, CalendarDays, CheckCircle2, PlusCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CsvSummary } from "@/hooks/useLeadsCsv";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  summary: CsvSummary | undefined;
  loading: boolean;
}

const cards = [
  { key: "total" as const, label: "Total de Leads", icon: Users, color: "text-primary" },
  { key: "hoje" as const, label: "Leads do Dia", icon: CalendarDays, color: "text-blue-600" },
  { key: "enviados" as const, label: "Enviados", icon: CheckCircle2, color: "text-green-600" },
  { key: "created" as const, label: "Novos (Created)", icon: PlusCircle, color: "text-cyan-600" },
  { key: "semStatus" as const, label: "Sem Status", icon: AlertCircle, color: "text-yellow-600" },
];

export function LeadsCsvSummary({ summary, loading }: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.key}>
          <CardContent className="flex items-center gap-3 p-4">
            <c.icon className={`h-8 w-8 ${c.color} shrink-0`} />
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{summary?.[c.key] ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
