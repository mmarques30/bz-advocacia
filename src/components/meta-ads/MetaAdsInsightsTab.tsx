import { MetaCampanha } from "@/types/meta-ads";
import { useMemo } from "react";
import { TrendingUp, AlertTriangle, Award, Zap, Target } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  campanhas: MetaCampanha[];
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Insight {
  Icon: LucideIcon;
  tone: "good" | "warn" | "info";
  title: string;
  desc: string;
}

function buildInsights(campanhas: MetaCampanha[]): Insight[] {
  const out: Insight[] = [];
  const ativas = campanhas.filter((c) => c.gasto > 0 || c.leads > 0);
  if (ativas.length === 0) return out;

  const top = [...ativas].filter((c) => c.leads > 0).sort((a, b) => a.custo_lead - b.custo_lead)[0];
  if (top) {
    out.push({
      Icon: Award, tone: "good",
      title: `Melhor CPL: ${top.nome}`,
      desc: `${fmtBRL(top.custo_lead)} por lead (${top.leads} leads, ${fmtBRL(top.gasto)} gastos).`,
    });
  }

  const torrando = [...ativas].filter((c) => c.gasto > 100 && c.leads === 0)
    .sort((a, b) => b.gasto - a.gasto)[0];
  if (torrando) {
    out.push({
      Icon: AlertTriangle, tone: "warn",
      title: `Gastando sem converter: ${torrando.nome}`,
      desc: `${fmtBRL(torrando.gasto)} sem nenhum lead. Vale revisar criativo ou pausar.`,
    });
  }

  const maisGasto = [...ativas].sort((a, b) => b.gasto - a.gasto)[0];
  if (maisGasto && maisGasto !== top) {
    out.push({
      Icon: TrendingUp, tone: "info",
      title: `Maior investimento: ${maisGasto.nome}`,
      desc: `${fmtBRL(maisGasto.gasto)} • ${maisGasto.leads} leads • CPL ${maisGasto.custo_lead > 0 ? fmtBRL(maisGasto.custo_lead) : "—"}`,
    });
  }

  const melhorCtr = [...ativas].filter((c) => c.impressoes > 1000).sort((a, b) => b.ctr - a.ctr)[0];
  if (melhorCtr && melhorCtr.ctr > 0) {
    out.push({
      Icon: Zap, tone: "info",
      title: `Maior engajamento: ${melhorCtr.nome}`,
      desc: `CTR ${melhorCtr.ctr.toFixed(2)}% em ${melhorCtr.impressoes.toLocaleString("pt-BR")} impressões.`,
    });
  }

  const totLeads = ativas.reduce((s, c) => s + c.leads, 0);
  const totGasto = ativas.reduce((s, c) => s + c.gasto, 0);
  if (totLeads > 0 && totGasto > 0) {
    out.push({
      Icon: Target, tone: "info",
      title: `Média geral`,
      desc: `${totLeads} leads, ${fmtBRL(totGasto / totLeads)} por lead em ${ativas.length} campanhas ativas.`,
    });
  }

  return out;
}

const TONE_CLS: Record<Insight["tone"], string> = {
  good: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

export function MetaAdsInsightsTab({ campanhas }: Props) {
  const insights = useMemo(() => buildInsights(campanhas), [campanhas]);

  if (insights.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Sem campanhas com dados suficientes pra gerar insights ainda — aguardando o 1º sync.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((i, idx) => {
        const Icon = i.Icon;
        return (
          <div key={idx} className={cn("border rounded-lg p-4 flex gap-3", TONE_CLS[i.tone])}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{i.title}</p>
              <p className="text-xs leading-snug mt-1 opacity-90">{i.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
