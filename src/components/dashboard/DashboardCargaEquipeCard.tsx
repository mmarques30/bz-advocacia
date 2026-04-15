import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { HeatmapRow } from "@/hooks/useDashboardVisual";

interface Props {
  data: HeatmapRow[];
  loading?: boolean;
}

function getCellStyle(value: number, isUrgente: boolean): React.CSSProperties {
  if (isUrgente && value > 0) return { backgroundColor: "#FCEBEB", color: "#A32D2D" };
  // Fix: --secondary e --muted-foreground sao identicos (cinza 40%) — usar
  // um como fundo e outro como texto deixava o "0" invisivel. Trocamos para
  // --muted (cinza claro 95%) + --foreground (texto principal).
  if (value === 0) return { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" };
  if (value <= 3) return { backgroundColor: "#E6F1FB", color: "#1a3a5c" };
  if (value <= 6) return { backgroundColor: "#B5D4F4", color: "#1a3a5c" };
  return { backgroundColor: "#378ADD", color: "#fff" };
}

const cols = [
  { key: "urgente" as const, label: "Urg." },
  { key: "alta" as const, label: "Alta" },
  { key: "media" as const, label: "Méd." },
  { key: "baixa" as const, label: "Baixa" },
  { key: "total" as const, label: "Total" },
];

export function DashboardCargaEquipeCard({ data, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Carga da equipe</CardTitle>
          <button
            onClick={() => navigate("/dashboard/processos/demandas")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver distribuição <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Sem dados de equipe
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Membro</th>
                    {cols.map((c) => (
                      <th key={c.key} className="text-center pb-2 font-medium text-muted-foreground w-12">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td className="py-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {row.iniciais}
                          </div>
                          <span className="truncate max-w-[80px]">{row.nome.split(" ")[0]}</span>
                        </div>
                      </td>
                      {cols.map((c) => (
                        <td key={c.key} className="py-1 text-center">
                          <span
                            className="inline-block w-8 h-6 rounded text-[11px] font-semibold leading-6"
                            style={getCellStyle(row[c.key], c.key === "urgente")}
                          >
                            {row[c.key]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>Intensidade:</span>
              <span className="w-4 h-3 rounded border border-border" style={{ backgroundColor: "hsl(var(--muted))" }} />
              <span>0</span>
              <span className="w-4 h-3 rounded" style={{ backgroundColor: "#E6F1FB" }} />
              <span>1–3</span>
              <span className="w-4 h-3 rounded" style={{ backgroundColor: "#B5D4F4" }} />
              <span>4–6</span>
              <span className="w-4 h-3 rounded" style={{ backgroundColor: "#378ADD" }} />
              <span>7+</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
