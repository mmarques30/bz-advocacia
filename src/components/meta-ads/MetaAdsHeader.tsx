import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetaKPIs, PeriodoFiltro } from "@/types/meta-ads";
import { DollarSign, Users, Target, TrendingUp, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  kpis: MetaKPIs;
  periodo: PeriodoFiltro;
  onPeriodoChange: (p: PeriodoFiltro) => void;
  ultimaStructure: string | null;
  ultimaInsights: string | null;
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MetaAdsHeader({ kpis, periodo, onPeriodoChange, ultimaStructure, ultimaInsights }: Props) {
  const cards = [
    {
      label: "Investimento",
      value: kpis.gasto > 0 ? brl(kpis.gasto) : "-",
      icon: DollarSign,
    },
    {
      label: "Leads (bot)",
      value: String(kpis.leads ?? 0),
      icon: Users,
    },
    {
      label: "Custo / Lead",
      value: kpis.custoLead > 0 ? brl(kpis.custoLead) : "-",
      icon: Target,
    },
    {
      label: "Taxa de Conversão",
      value: kpis.taxaConversao != null ? `${kpis.taxaConversao.toFixed(1)}%` : "-",
      subtitle: kpis.leadsConvertidos != null ? `${kpis.leadsConvertidos} convertidos` : undefined,
      icon: TrendingUp,
    },
  ];

  const ago = (iso: string | null) =>
    iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR }) : "nunca";

  return (
    <div className="space-y-4">
      {/* Linha 1: titulo + filtro */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-seasons text-primary">Dashboard de Marketing</h1>
          <p className="text-muted-foreground text-sm">
            Conectado ao Meta Ads (Business Manager B&Z)
          </p>
        </div>
        <Select value={periodo} onValueChange={(v) => onPeriodoChange(v as PeriodoFiltro)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Linha 2: 4 KPIs grandes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2">{c.value}</p>
              {c.subtitle && <p className="text-xs text-muted-foreground mt-1">{c.subtitle}</p>}
            </Card>
          );
        })}
      </div>

      {/* Linha 3: status de sincronizacao */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Estrutura sincronizada {ago(ultimaStructure)}</span>
        <span>•</span>
        <span>Insights sincronizados {ago(ultimaInsights)}</span>
      </div>
    </div>
  );
}
