import { Card } from "@/components/ui/card";
import { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { MetaKPIs } from "@/types/meta-ads";
import { Users, DollarSign, Target, TrendingUp, MousePointerClick, BarChart3, UserCheck, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  valueClassName?: string;
}

function KPICard({ title, value, subtitle, icon: Icon, valueClassName }: KPICardProps) {
  return (
    <Card className="border rounded-xl bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold mt-2", valueClassName)}>{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}

interface Props {
  analytics: MarketingCsvAnalytics;
  metaKpis?: MetaKPIs;
}

export function MarketingDashboardKPIs({ analytics, metaKpis }: Props) {
  const hasMetaData = metaKpis && (metaKpis.impressoes > 0 || metaKpis.cliques > 0);

  // Quando meta_insights_daily / v_meta_lead_funnel estao populados, os
  // numeros sao reais. Cai pro CSV (analytics) so quando o Meta ainda
  // nao trouxe dado.
  const totalLeads = metaKpis?.leads && metaKpis.leads > 0 ? metaKpis.leads : analytics.totalLeads;
  const leadsConvertidos = metaKpis?.leadsConvertidos ??
    Math.round(analytics.taxaConversao * analytics.totalLeads / 100);
  const taxaConversao = metaKpis?.taxaConversao ?? analytics.taxaConversao;

  const custoLead = hasMetaData && metaKpis.custoLead > 0
    ? `R$ ${metaKpis.custoLead.toFixed(2)}`
    : "-";

  const ctr = hasMetaData && metaKpis.ctr > 0
    ? `${metaKpis.ctr.toFixed(1)}%`
    : "-";

  const cpc = hasMetaData && metaKpis.cpc > 0
    ? `R$ ${metaKpis.cpc.toFixed(2)}`
    : "-";

  // ROI: spec da Juliana — "deixa '-' por enquanto. Vai depender de campo
  // de receita por lead que ainda nao temos".
  const roiDisplay = "-";

  const leadsVariation = analytics.leadsSemana > 0 && totalLeads > 0
    ? `+${Math.round((analytics.leadsSemana / totalLeads) * 100)}% na semana`
    : `${analytics.leadsSemana} na última semana`;

  const kpis = [
    { title: "Total de Leads", value: String(totalLeads), subtitle: leadsVariation, icon: Users },
    { title: "Custo por Lead", value: custoLead, subtitle: "Investimento / leads", icon: DollarSign },
    { title: "Taxa de Conversão", value: `${taxaConversao.toFixed(1)}%`, subtitle: `${leadsConvertidos} leads convertidos`, icon: Target },
    { title: "ROI", value: roiDisplay, subtitle: "Retorno sobre investimento", icon: TrendingUp },
    { title: "CTR Médio", value: ctr, subtitle: "Taxa de cliques nos anúncios", icon: MousePointerClick },
    { title: "CPC Médio", value: cpc, subtitle: "Custo por clique", icon: BarChart3 },
    { title: "Taxa de Qualificação", value: `${analytics.taxaQualificacao}%`, subtitle: `${Math.round(analytics.taxaQualificacao * analytics.totalLeads / 100)} leads qualificados`, icon: UserCheck },
  ];

  return (
    <div className="relative px-12">
      <Carousel opts={{ align: "start", loop: true }}>
        <CarouselContent>
          {kpis.map((kpi) => (
            <CarouselItem key={kpi.title} className="basis-1/2 md:basis-1/4">
              <KPICard {...kpi} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-2" />
        <CarouselNext className="-right-2" />
      </Carousel>
    </div>
  );
}
