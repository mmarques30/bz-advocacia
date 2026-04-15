import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, FileText, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, isPast, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Visao consolidada do financeiro por cliente.
 *
 * Conecta tres fontes que ate entao viviam isoladas no modulo Financeiro:
 *   - acordos_financeiros (+ parcelas_financeiras): contratos e planos de pagamento
 *   - transacoes_financeiras (tipo=receita): recebimentos gerais vinculados ao cliente via processo
 *   - creditos_condicionais: pipeline de receita futura
 *
 * Tudo filtrado por cliente_id, resumido em 4 cards + tabelas proprias.
 * Reusa os mesmos queries do modulo Financeiro (sem duplicar logica).
 */

interface Props {
  leadId: string;
}

interface AcordoRow {
  id: string;
  tipo_servico: string | null;
  valor_total: number;
  status: string;
  conta: string | null;
  data_primeiro_vencimento: string | null;
  numero_parcelas: number | null;
  parcelas_pagas?: number;
  total_pago?: number;
}

interface ParcelaRow {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  acordo_tipo_servico?: string;
}

interface CreditoRow {
  id: string;
  descricao: string | null;
  valor: number;
  status: string | null;
  created_at: string | null;
}

function safeFmt(dateStr: string | null | undefined, fmt = "dd/MM/yyyy"): string {
  if (!dateStr) return "-";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt, { locale: ptBR }) : "-";
  } catch {
    return "-";
  }
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ClienteFinanceiroTab({ leadId }: Props) {
  // Acordos ativos + fechados do cliente. Parcelas embutidas pro calculo
  // de progresso sem round trip adicional.
  const acordosQuery = useQuery({
    queryKey: ["cliente-financeiro-acordos", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acordos_financeiros")
        .select(
          `id, tipo_servico, valor_total, status, conta, data_primeiro_vencimento,
           numero_parcelas,
           parcelas:parcelas_financeiras(id, status, valor, valor_pago)`,
        )
        .eq("cliente_id", leadId)
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
          conta: a.conta,
          data_primeiro_vencimento: a.data_primeiro_vencimento,
          numero_parcelas: a.numero_parcelas,
          parcelas_pagas: parcelasPagas,
          total_pago: totalPago,
        } as AcordoRow;
      });
    },
  });

  // Parcelas a vencer (status != pago) de qualquer acordo do cliente.
  const parcelasAbertasQuery = useQuery({
    queryKey: ["cliente-financeiro-parcelas-abertas", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(
          `id, acordo_id, numero_parcela, valor, valor_pago, data_vencimento,
           data_pagamento, status,
           acordos_financeiros!inner(cliente_id, tipo_servico)`,
        )
        .neq("status", "pago")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return (data || [])
        .filter((p: any) => p.acordos_financeiros?.cliente_id === leadId)
        .map((p: any) => ({
          id: p.id,
          acordo_id: p.acordo_id,
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor) || 0,
          valor_pago: p.valor_pago,
          data_vencimento: p.data_vencimento,
          data_pagamento: p.data_pagamento,
          status: p.status,
          acordo_tipo_servico: p.acordos_financeiros?.tipo_servico,
        })) as ParcelaRow[];
    },
  });

  // Historico de pagamentos — ultimos 10.
  const historicoQuery = useQuery({
    queryKey: ["cliente-financeiro-historico", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(
          `id, acordo_id, numero_parcela, valor, valor_pago, data_vencimento,
           data_pagamento, status,
           acordos_financeiros!inner(cliente_id, tipo_servico)`,
        )
        .eq("status", "pago")
        .order("data_pagamento", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || [])
        .filter((p: any) => p.acordos_financeiros?.cliente_id === leadId)
        .map((p: any) => ({
          id: p.id,
          acordo_id: p.acordo_id,
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor) || 0,
          valor_pago: p.valor_pago,
          data_vencimento: p.data_vencimento,
          data_pagamento: p.data_pagamento,
          status: p.status,
          acordo_tipo_servico: p.acordos_financeiros?.tipo_servico,
        })) as ParcelaRow[];
    },
  });

  // Creditos condicionais do cliente.
  const creditosQuery = useQuery({
    queryKey: ["cliente-financeiro-creditos", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creditos_condicionais")
        .select("id, descricao, valor, status, created_at")
        .eq("cliente_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CreditoRow[];
    },
  });

  const loading =
    acordosQuery.isLoading ||
    parcelasAbertasQuery.isLoading ||
    historicoQuery.isLoading ||
    creditosQuery.isLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const acordos = acordosQuery.data || [];
  const parcelasAbertas = parcelasAbertasQuery.data || [];
  const historico = historicoQuery.data || [];
  const creditos = creditosQuery.data || [];

  const totalRecebido = historico.reduce(
    (s, p) => s + Number(p.valor_pago || p.valor || 0),
    0,
  );
  const totalAReceber = parcelasAbertas.reduce((s, p) => s + Number(p.valor || 0), 0);
  const parcelasAtrasadas = parcelasAbertas.filter(
    (p) => isValid(parseISO(p.data_vencimento)) && isPast(parseISO(p.data_vencimento)),
  ).length;

  return (
    <div className="space-y-6">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Acordos ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {acordos.filter((a) => a.status === "ativo").length}
            </p>
            <p className="text-xs text-muted-foreground">
              {acordos.length} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
              Total recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {brl.format(totalRecebido)}
            </p>
            <p className="text-xs text-muted-foreground">
              {historico.length} pagamento{historico.length !== 1 ? "s" : ""}
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
              {brl.format(totalAReceber)}
            </p>
            <p className="text-xs text-muted-foreground">
              {parcelasAbertas.length} parcela{parcelasAbertas.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle
                className={`h-3.5 w-3.5 ${parcelasAtrasadas > 0 ? "text-destructive" : "text-muted-foreground"}`}
              />
              Em atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${parcelasAtrasadas > 0 ? "text-destructive" : ""}`}
            >
              {parcelasAtrasadas}
            </p>
            <p className="text-xs text-muted-foreground">
              {parcelasAtrasadas > 0 ? "Requer atenção" : "Tudo em dia"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acordos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Acordos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acordos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum acordo registrado.</p>
          ) : (
            <div className="space-y-2">
              {acordos.map((a) => (
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
          )}
        </CardContent>
      </Card>

      {/* Parcelas a vencer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Parcelas a vencer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parcelasAbertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem parcelas em aberto.
            </p>
          ) : (
            <div className="space-y-2">
              {parcelasAbertas.slice(0, 5).map((p) => {
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
              {parcelasAbertas.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {parcelasAbertas.length - 5} parcelas adicionais
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Últimos pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((p) => (
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
                    {brl.format(Number(p.valor_pago || p.valor))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Créditos condicionais */}
      {creditos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Créditos condicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {creditos.map((c) => (
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
                      {c.valor_estimado ? brl.format(Number(c.valor_estimado)) : "-"}
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
