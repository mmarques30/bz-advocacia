import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TarefaBreakdown } from "@/hooks/useDashboardVisual";

interface Props {
  data: TarefaBreakdown;
  loading?: boolean;
}

const blocks = [
  { key: "urgentes" as const, label: "Urgentes", bg: "#FCEBEB", color: "#A32D2D", filter: "?prioridade=urgente" },
  { key: "atrasadas" as const, label: "Atrasadas", bg: "#FAEEDA", color: "#854F0B", filter: "?atrasadas=true" },
  { key: "concluidasSemana" as const, label: "Concluídas (semana)", bg: "#EAF3DE", color: "#3B6D11", filter: "" },
  { key: "pendentes" as const, label: "Pendentes", bg: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", filter: "?status=pendente" },
];

export function DashboardSituacaoTarefasCard({ data, loading }: Props) {
  const navigate = useNavigate();
  const taxaConclusao =
    data.totalAtivas + data.concluidasSemana > 0
      ? Math.round((data.concluidasSemana / (data.totalAtivas + data.concluidasSemana)) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Situação das tarefas</CardTitle>
          <button
            onClick={() => navigate("/dashboard/processos/demandas")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Abrir tarefas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {blocks.map((b) => {
            const val = data[b.key];
            const isZero = val === 0;
            return (
              <button
                key={b.key}
                onClick={() => b.filter && navigate(`/dashboard/processos/demandas${b.filter}`)}
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
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={taxaConclusao} className="h-2" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#3B6D11" }}>
            {taxaConclusao}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">Conclusão da semana</p>
      </CardContent>
    </Card>
  );
}
