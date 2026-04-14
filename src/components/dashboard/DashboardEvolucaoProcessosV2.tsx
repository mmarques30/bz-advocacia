import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { ProcessoEvolucaoMes } from "@/hooks/useProcessosEvolucao";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: ProcessoEvolucaoMes[];
  loading?: boolean;
}

export function DashboardEvolucaoProcessosV2({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Evolução mensal de processos</CardTitle>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3B6D11" }} />
              <span className="text-muted-foreground">Abertos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#A32D2D" }} />
              <span className="text-muted-foreground">Concluídos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickCount={4} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="abertos" fill="#3B6D11" radius={[3, 3, 0, 0]} name="Abertos" />
              <Bar dataKey="concluidos" fill="#A32D2D" radius={[3, 3, 0, 0]} name="Concluídos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
