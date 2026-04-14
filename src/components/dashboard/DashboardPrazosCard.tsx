import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PrazosBreakdown, ProximoPrazo } from "@/hooks/useDashboardVisual";

interface Props {
  prazos: PrazosBreakdown;
  proximosPrazos: ProximoPrazo[];
  loading?: boolean;
}

const blocks = [
  { key: "atrasados" as const, label: "Atrasados", bg: "#FCEBEB", color: "#A32D2D" },
  { key: "hoje" as const, label: "Hoje", bg: "#FAEEDA", color: "#854F0B" },
  { key: "estaSemana" as const, label: "Esta semana", bg: "#EAF3DE", color: "#3B6D11" },
  { key: "dias30" as const, label: "30 dias", bg: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" },
];

function getDotColor(dias: number) {
  if (dias <= 0) return "#A32D2D";
  if (dias <= 3) return "#854F0B";
  return "#3B6D11";
}

export function DashboardPrazosCard({ prazos, proximosPrazos, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Prazos processuais</CardTitle>
          <button
            onClick={() => navigate("/dashboard/processos/calendario")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Calendário <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {blocks.map((b) => {
            const val = prazos[b.key];
            const isZero = val === 0;
            return (
              <button
                key={b.key}
                onClick={() => navigate("/dashboard/processos/calendario")}
                className="rounded-lg p-3 text-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isZero ? "hsl(var(--secondary))" : b.bg,
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: isZero ? "hsl(var(--muted-foreground))" : b.color }}
                >
                  {val}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{b.label}</p>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {proximosPrazos.length > 0 && (
          <div className="border-l-2 border-border ml-2 space-y-3 pl-4">
            {proximosPrazos.map((p) => (
              <div key={p.id} className="relative flex items-start gap-2">
                <div
                  className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card"
                  style={{ backgroundColor: getDotColor(p.dias_restantes) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {p.cliente_nome || "Processo"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.descricao}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor:
                      p.dias_restantes <= 1
                        ? "#FCEBEB"
                        : p.dias_restantes <= 3
                        ? "#FAEEDA"
                        : "#EAF3DE",
                    color:
                      p.dias_restantes <= 1
                        ? "#A32D2D"
                        : p.dias_restantes <= 3
                        ? "#854F0B"
                        : "#3B6D11",
                  }}
                >
                  {p.dias_restantes}d
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
