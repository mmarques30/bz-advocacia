import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LeadsFunil, LeadPendente } from "@/hooks/useDashboardPrincipal";

interface Props {
  funil: LeadsFunil;
  taxaConversao: number;
  leadsParados: LeadPendente[];
  loading?: boolean;
}

const stages = [
  { key: "novo" as const, label: "Novo", color: "#378ADD" },
  { key: "em_contato" as const, label: "Em contato", color: "#3B6D11" },
  { key: "proposta" as const, label: "Proposta", color: "#854F0B" },
  { key: "perdido" as const, label: "Perdido", color: "#A32D2D" },
];

export function DashboardPipelineLeadsCard({
  funil,
  taxaConversao,
  leadsParados,
  loading,
}: Props) {
  const navigate = useNavigate();
  const max = Math.max(funil.novo, funil.em_contato, funil.proposta, funil.perdido, 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Pipeline de leads</CardTitle>
          <button
            onClick={() => navigate("/dashboard/leads")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver leads <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funnel bars */}
        <div className="space-y-2">
          {stages.map((s) => {
            const val = funil[s.key];
            const width = Math.max((val / max) * 100, val > 0 ? 12 : 0);
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-16 text-right">{s.label}</span>
                <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: "hsl(var(--secondary))" }}>
                  <div
                    className="h-full rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all"
                    style={{ width: `${width}%`, backgroundColor: val > 0 ? s.color : "transparent", minWidth: val > 0 ? 28 : 0 }}
                  >
                    {val > 0 && val}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversão */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Conversão do mês</span>
            <span className="font-semibold" style={{ color: "#3B6D11" }}>{taxaConversao}%</span>
          </div>
          <Progress value={taxaConversao} className="h-2" />
        </div>

        {/* Leads parados */}
        {leadsParados.length > 0 && (
          <div className="rounded-lg p-2 flex items-start gap-2" style={{ backgroundColor: "#FAEEDA" }}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#854F0B" }} />
            <div className="text-[11px]" style={{ color: "#854F0B" }}>
              <span className="font-semibold">{leadsParados[0].nome}</span> parado há {leadsParados[0].dias_parado} dias
              {leadsParados.length > 1 && ` (+${leadsParados.length - 1} outros)`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
