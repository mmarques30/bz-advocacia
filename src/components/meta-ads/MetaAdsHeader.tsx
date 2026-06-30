import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetaKPIs, PeriodoFiltro } from "@/types/meta-ads";
import { DollarSign, Users, Target, TrendingUp, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { MiniCard } from "./MiniCard";

interface Props {
  kpis: MetaKPIs;
  periodo: PeriodoFiltro;
  onPeriodoChange: (p: PeriodoFiltro) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  ultimaStructure: string | null;
  ultimaInsights: string | null;
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MetaAdsHeader({
  kpis, periodo, onPeriodoChange, statusFilter, onStatusChange,
  ultimaStructure, ultimaInsights,
}: Props) {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // 4 KPIs compactos
  const cards = [
    { label: "Investimento", value: kpis.gasto > 0 ? brl(kpis.gasto) : "—", Icon: DollarSign },
    { label: "Leads (bot)", value: String(kpis.leads ?? 0), Icon: Users },
    { label: "Custo / Lead", value: kpis.custoLead > 0 ? brl(kpis.custoLead) : "—", Icon: Target },
    {
      label: "Conversão",
      value: kpis.taxaConversao != null ? `${kpis.taxaConversao.toFixed(1)}%` : "—",
      sub: kpis.leadsConvertidos != null ? `${kpis.leadsConvertidos} convertidos` : undefined,
      Icon: TrendingUp,
    },
  ];

  const ago = (iso: string | null) =>
    iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR }) : "nunca";

  // Sync esperado: insights de hora em hora, estrutura diária. Se passou
  // muito do esperado, sinaliza que parou de atualizar (token expirado,
  // secret do vault, ou edge function com erro — ver meta_execution_log).
  const horasDesde = (iso: string | null): number | null =>
    iso ? (Date.now() - new Date(iso).getTime()) / 36e5 : null;
  const insightsHoras = horasDesde(ultimaInsights);
  const structureHoras = horasDesde(ultimaStructure);
  const insightsStale = insightsHoras === null || insightsHoras > 3;
  const structureStale = structureHoras === null || structureHoras > 48;
  const algumStale = insightsStale || structureStale;

  async function sincronizar() {
    setSyncing(true);
    try {
      const [r1, r2] = await Promise.all([
        supabase.rpc("trigger_meta_sync", { target: "structure" }),
        supabase.rpc("trigger_meta_sync", { target: "insights" }),
      ]);
      if (r1.error) throw new Error(r1.error.message);
      if (r2.error) throw new Error(r2.error.message);
      toast({ title: "Sincronização disparada", description: "Os dados devem atualizar em alguns segundos." });
      // Aguarda o sync rodar e invalida queries
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["meta-insights-daily"] });
        qc.invalidateQueries({ queryKey: ["meta-lead-funnel"] });
        qc.invalidateQueries({ queryKey: ["meta-campaigns-aggregated"] });
        qc.invalidateQueries({ queryKey: ["meta-adsets-aggregated"] });
        qc.invalidateQueries({ queryKey: ["meta-ads-aggregated"] });
        qc.invalidateQueries({ queryKey: ["meta-sync-status"] });
        qc.invalidateQueries({ queryKey: ["meta-performance-tab"] });
        qc.invalidateQueries({ queryKey: ["meta-pipeline-by-campaign"] });
        qc.invalidateQueries({ queryKey: ["meta-leads-by-campaign"] });
        qc.invalidateQueries({ queryKey: ["meta-funil-detalhe"] });
      }, 6000);
    } catch (e: any) {
      toast({
        title: "Erro ao sincronizar",
        description: e?.message ?? "Verifica o vault sdr_webhook_secret e as edge functions.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Linha 1: titulo + acoes */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-seasons text-primary">Dashboard de Marketing</h1>
          <p className="text-muted-foreground text-xs">
            Conectado ao Meta Ads (Business Manager B&Z)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ACTIVE">Ativas</SelectItem>
              <SelectItem value="PAUSED">Pausadas</SelectItem>
              <SelectItem value="ARCHIVED">Arquivadas</SelectItem>
              <SelectItem value="DELETED">Excluídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => onPeriodoChange(v as PeriodoFiltro)}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={sincronizar}
            disabled={syncing}
            className="h-9 text-xs"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Linha 2: 4 KPIs compactos (MiniCard padronizado) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((c) => (
          <MiniCard key={c.label} label={c.label} value={c.value} sub={c.sub} Icon={c.Icon} />
        ))}
      </div>

      {/* Linha 3: status sincronizacao */}
      <div className="flex items-center gap-3 text-[11px] flex-wrap">
        <span className={structureStale ? "text-destructive font-medium" : "text-muted-foreground"}>
          Estrutura: {ago(ultimaStructure)}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className={insightsStale ? "text-destructive font-medium" : "text-muted-foreground"}>
          Insights: {ago(ultimaInsights)}
        </span>
        {algumStale && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sincronização atrasada — clique em "Sincronizar". Se o erro persistir, a conexão com o
            Meta pode ter expirado (verifique o token e o log de execução).
          </span>
        )}
      </div>
    </div>
  );
}
