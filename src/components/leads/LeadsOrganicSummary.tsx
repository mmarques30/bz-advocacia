import { useMemo } from "react";
import { Users, CalendarDays, XCircle, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lead } from "@/types/leads";

interface Props {
  leads: Lead[] | undefined;
  loading: boolean;
}

export function LeadsOrganicSummary({ leads, loading }: Props) {
  const summary = useMemo(() => {
    if (!leads) return { total: 0, novos: 0, enviados: 0, qualificados: 0, perdidos: 0 };
    return {
      total: leads.length,
      novos: leads.filter(l => (l.estagio || "").toLowerCase() === "novo").length,
      enviados: leads.filter(l => (l.estagio || "").toLowerCase() === "contato_inicial").length,
      qualificados: leads.filter(l => {
        const e = (l.estagio || "").toLowerCase();
        return e === "em_analise" || e === "proposta_enviada";
      }).length,
      perdidos: leads.filter(l => (l.estagio || "").toLowerCase() === "perdido").length,
    };
  }, [leads]);

  const cards = [
    { key: "total" as const, label: "Total de Leads", icon: Users, color: "text-primary" },
    { key: "novos" as const, label: "Novos", icon: CalendarDays, color: "text-blue-600" },
    { key: "enviados" as const, label: "Enviados", icon: Send, color: "text-green-600" },
    { key: "qualificados" as const, label: "Qualificados", icon: CheckCircle2, color: "text-purple-600" },
    { key: "perdidos" as const, label: "Perdidos", icon: XCircle, color: "text-red-600" },
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
