import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Processo } from "@/types/processos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  FileText,
  Calendar,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  DollarSign,
} from "lucide-react";
import { format, isPast, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Aba "Financeiro" dentro de um Processo.
 *
 * Antes era apenas um placeholder com alerta "funcionalidade futura".
 * Agora exibe a vida financeira real do processo: acordos, parcelas
 * abertas, historico de pagamentos, despesas vinculadas e creditos
 * condicionais. Mesmo shape do ClienteFinanceiroTab (consistencia de
 * UX), mas filtrado por processo_id em vez de cliente_id.
 */

interface Props {
  processo: Processo;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function safeFmt(dateStr: string | null | undefined, fmt = "dd/MM/yyyy"): string {
  if (!dateStr) return "-";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt, { locale: ptBR }) : "-";
  } catch {
    return "-";
  }
}

export function ProcessoFinanceiroTab({ processo }: Props) {
  const processoId = processo.id;

  // Acordos vinculados ao processo (com parcelas embarcadas).
  const acordosQuery = useQuery({
    queryKey: ["processo-financeiro-acordos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acordos_financeiros")
        .select(
          `id, tipo_servico, valor_total, status, conta, data_primeiro_vencimento,
           numero_parcelas,
           parcelas:parcelas_financeiras(id, status, valor, valor_pago)`,
        )
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => {
        const parcelas = a.parcelas || [];
        const parcelasPagas = parcelas.filter((p: any) => p.status === "pago").length;
        const totalPago = parcelas
          .filter((p: any) => p.status === "pago")
          .reduce((s: number, p: any) => s + Number(p.valor_pago || 0), 0);
        return {
          id: a.id,
          tipo_servico: a.tipo_servico,
          valor_total: Number(a.valor_total) || 0,
          status: a.status,
          numero_parcelas: a.numero_parcelas,
          parcelas_pagas: parcelasPagas,
          total_pago: totalPago,
        };
      });
    },
  });

  // Parcelas abertas dos acordos do processo.
  const parcelasAbertasQuery = useQuery({
    queryKey: ["processo-financeiro-parcelas-abertas", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(
          `id, acordo_id, numero_parcela, valor, data_vencimento, status,
           acordos_financeiros!inner(processo_id, tipo_servico)`,
        )
        .neq("status", "pago")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return (data || [])
        .filter((p: any) => p.acordos_financeiros?.processo_id === processoId)
        .map((p: any) => ({
          id: p.id,
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor) || 0,
          data_vencimento: p.data_vencimento,
          status: p.status,
          acordo_tipo_servico: p.acordos_financeiros?.tipo_servico,
        }));
    },
  });

  // Historico — ultimas 10 parcelas pagas do processo.
  const historicoQuery = useQuery({
    queryKey: ["processo-financeiro-historico", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(
          `id, numero_parcela, valor, valor_pago, data_pagamento, data_vencimento, status,
           acordos_financeiros!inner(processo_id, tipo_servico)`,
        )
        .eq("status", "pago")
        .order("data_pagamento", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || [])
        .filter((p: any) => p.acordos_financeiros?.processo_id === processoId)
        .map((p: any) => ({
          id: p.id,
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor) || 0,
          valor_pago: Number(p.valor_pago) || 0,
          data_pagamento: p.data_pagamento,
          data_vencimento: p.data_vencimento,
          acordo_tipo_servico: p.acordos_financeiros?.tipo_servico,
        }));
    },
  });

  // Despesas vinculadas ao processo (tabela despesas OU transacoes_financeiras
  // com categoria=despesa + processo_id). Usamos a tabela despesas como fonte
  // primaria por ter mais campos; fallback para transacoes se necessario.
  const despesasQuery = useQuery({
    queryKey: ["processo-financeiro-despesas", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("id, descricao, valor, data, categoria, status, forma_pagamento")
        .eq("processo_id", processoId)
        .order("data", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor) || 0,
        data: d.data,
        categoria: d.categoria,
        status: d.status,
        forma_pagamento: d.forma_pagamento,
      }));
    },
  });

  // Creditos condicionais linkados ao processo.
  const creditosQuery = useQuery({
    queryKey: ["processo-financeiro-creditos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creditos_condicionais")
        .select("id, descricao, valor, status, created_at")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []);
    },
  });

  const loading =
    acordosQuery.isLoading ||
    parcelasAbertasQuery.isLoading ||
    historicoQuery.isLoading ||
    despesasQuery.isLoading ||
    creditosQuery.isLoading;

  // Totalizadores (memoizados pra nao refazer em cada render).
  const resumo = useMemo(() => {
    const acordos = acordosQuery.data || [];
    const parcelasAbertas = parcelasAbertasQuery.data || [];
    const historico = historicoQuery.data || [];
    const despesas = despesasQuery.data || [];

    const totalRecebido = historico.reduce(
      (s, p) => s + Number(p.valor_pago || p.valor || 0),
      0,
    );
    const totalAReceber = parcelasAbertas.reduce((s, p) => s + Number(p.valor || 0), 0);
    const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
    const parcelasAtrasadas = parcelasAbertas.filter(
      (p) => isValid(parseISO(p.data_vencimento)) && isPast(parseISO(p.data_vencimento)),
    ).length;

    return {
      acordos,
      parcelasAbertas,
      historico,
      despesas,
      totalRecebido,
      totalAReceber,
      totalDespesas,
      parcelasAtrasadas,
      saldoLiquido: totalRecebido - totalDespesas,
    };
  }, [
    acordosQuery.data,
    parcelasAbertasQuery.data,
    historicoQuery.data,
    despesasQuery.data,
  ]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const creditos = creditosQuery.data || [];

  const temDados =
    resumo.acordos.length > 0 ||
    resumo.parcelasAbertas.length > 0 ||
    resumo.historico.length > 0 ||
    resumo.despesas.length > 0 ||
    creditos.length > 0 ||
    processo.valor;

  if (!temDados) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhum registro financeiro vinculado a este processo</p>
          <p className="text-xs text-muted-foreground">
            Acordos, parcelas, despesas e créditos aparecerão aqui quando forem associados ao processo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
              Total recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {brl.format(resumo.totalRecebido)}
            </p>
            <p className="text-xs text-muted-foreground">
              {resumo.historico.length} pagamento{resumo.historico.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" />
              A receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">
              {brl.format(resumo.totalAReceber)}
            </p>
            <p className="text-xs text-muted-foreground">
              {resumo.parcelasAbertas.length} parcela{resumo.parcelasAbertas.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5 text-destructive" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {brl.format(resumo.totalDespesas)}
            </p>
            <p className="text-xs text-muted-foreground">
              {resumo.despesas.length} lançamento{resumo.despesas.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Saldo líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${resumo.saldoLiquido >= 0 ? "text-primary" : "text-destructive"}`}
            >
              {brl.format(resumo.saldoLiquido)}
            </p>
            <p className="text-xs text-muted-foreground">
              Recebido − despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Valor base do processo (se existir) */}
      {processo.valor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Valor do processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{brl.format(Number(processo.valor))}</p>
            {processo.cliente?.nome_completo && (
              <p className="text-sm text-muted-foreground mt-1">
                Cliente: {processo.cliente.nome_completo}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acordos */}
      {resumo.acordos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Acordos ({resumo.acordos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resumo.acordos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/40"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {a.tipo_servico || "Acordo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.parcelas_pagas ?? 0}/{a.numero_parcelas ?? 0} parcelas pagas •{" "}
                      {brl.format(a.total_pago ?? 0)} de {brl.format(a.valor_total)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.status === "ativo"
                        ? "default"
                        : a.status === "concluido"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcelas a vencer */}
      {resumo.parcelasAbertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Parcelas a vencer
              {resumo.parcelasAtrasadas > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {resumo.parcelasAtrasadas} atrasada
                  {resumo.parcelasAtrasadas !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resumo.parcelasAbertas.slice(0, 5).map((p) => {
                const atrasada =
                  isValid(parseISO(p.data_vencimento)) && isPast(parseISO(p.data_vencimento));
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      atrasada ? "bg-destructive/5 border-destructive/30" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Parcela {p.numero_parcela} — {p.acordo_tipo_servico || "Acordo"}
                      </p>
                      <p
                        className={`text-xs ${atrasada ? "text-destructive font-medium" : "text-muted-foreground"}`}
                      >
                        Vence em {safeFmt(p.data_vencimento)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{brl.format(p.valor)}</p>
                  </div>
                );
              })}
              {resumo.parcelasAbertas.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {resumo.parcelasAbertas.length - 5} parcelas adicionais
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de pagamentos */}
      {resumo.historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Últimos pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resumo.historico.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.acordo_tipo_servico || "Acordo"} — parcela {p.numero_parcela}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pago em {safeFmt(p.data_pagamento || p.data_vencimento)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    {brl.format(p.valor_pago || p.valor)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Despesas */}
      {resumo.despesas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Despesas do processo ({resumo.despesas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resumo.despesas.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {safeFmt(d.data)} • {d.categoria || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={d.status === "pago" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {d.status}
                    </Badge>
                    <p className="text-sm font-semibold text-destructive">
                      {brl.format(d.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Créditos condicionais */}
      {creditos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Créditos condicionais ({creditos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {creditos.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.descricao || "Crédito"}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado em {safeFmt(c.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {c.valor ? brl.format(Number(c.valor)) : "-"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
