import { useMemo } from "react";
import { Users, CalendarDays, XCircle, PlusCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lead } from "@/types/leads";

interface Props {
  leads: Lead[] | undefined;
  loading: boolean;
}

export function LeadsOrganicSummary({ leads, loading }: Props) {
  const summary = useMemo(() => {
    if (!leads) return { total: 0, hoje: 0, novos: 0, perdidos: 0, emAndamento: 0 };
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: leads.length,
      hoje: leads.filter(l => l.created_at?.slice(0, 10) === today).length,
      novos: leads.filter(l => (l.estagio || "").toLowerCase() === "novo").length,
      perdidos: leads.filter(l => (l.estagio || "").toLowerCase() === "perdido").length,
      emAndamento: leads.filter(l => {
        const e = (l.estagio || "").toLowerCase();
        return e === "contato_inicial" || e === "em_analise" || e === "proposta_enviada";
      }).length,
    };
  }, [leads]);

  const cards = [
    { key: "total" as const, label: "Total de Leads", icon: Users, color: "text-primary" },
    { key: "hoje" as const, label: "Leads do Dia", icon: CalendarDays, color: "text-blue-600" },
    { key: "novos" as const, label: "Novos", icon: PlusCircle, color: "text-cyan-600" },
    { key: "perdidos" as const, label: "Perdidos", icon: XCircle, color: "text-red-600" },
    { key: "emAndamento" as const, label: "Em Andamento", icon: AlertCircle, color: "text-yellow-600" },
  ];

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
                <p className="text-2xl font-bold">{summary[c.key]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
