import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useDistribuicaoSocia } from "@/hooks/useVisaoGeralFinanceiro";
import { useAdvogadas, type Advogada } from "@/hooks/useAdvogadas";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRightLeft } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  ano: number | null;
}

/**
 * Chave de conta para o filtro do useDistribuicaoSocia. Usa legacy_key
 * quando disponivel (juliana/liziane) para preservar compat com dados
 * legados; senao usa o apelido normalizado da advogada (caminho novo
 * conforme Fase C do refactor — docs/migracao-advogadas-hardcoded.md).
 */
function contaKey(adv: Advogada): string {
  return adv.legacy_key ?? adv.apelido;
}

function SociaSection({ advogada, ano }: { advogada: Advogada; ano: number | null }) {
  const { data, isLoading } = useDistribuicaoSocia(ano, contaKey(advogada));

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{advogada.nome_completo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-primary/10">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="font-bold text-primary">{fmt(data.receitas)}</p>
          </div>
          <div className="p-2 rounded bg-destructive/10">
            <p className="text-xs text-muted-foreground">Despesas PF</p>
            <p className="font-bold text-destructive">{fmt(data.despesasPF)}</p>
          </div>
          <div className="p-2 rounded bg-secondary/10">
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className={`font-bold ${data.liquido >= 0 ? "text-primary" : "text-destructive"}`}>
              {fmt(data.liquido)}
            </p>
          </div>
        </div>

        {/* Receitas */}
        <div>
          <h4 className="text-sm font-medium mb-2">Recebimentos ({data.receitasList.length})</h4>
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs text-right">Valor</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.receitasList.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.descricao}</TableCell>
                    <TableCell className="text-xs text-right text-primary font-medium">
                      {fmt(r.valor)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.data ? format(new Date(r.data + "T12:00:00"), "dd/MM", { locale: ptBR }) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Despesas PF */}
        {data.despesasList.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Despesas Pessoais ({data.despesasList.length})</h4>
            <div className="border rounded-lg max-h-36 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.despesasList.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs">{d.descricao}</TableCell>
                      <TableCell className="text-xs text-right text-destructive font-medium">
                        {fmt(d.valor)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.data ? format(new Date(d.data + "T12:00:00"), "dd/MM", { locale: ptBR }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Card que sugere transferencia para equalizar os liquidos entre socias.
 * Generalizado para N socias: pega a com maior liquido e a com menor;
 * sugere transferir metade da diferenca de uma para outra.
 *
 * Usa useQueries para chamar uma query dinamica por advogada — chave
 * compartilhada com o useDistribuicaoSocia do SociaSection, entao o
 * cache do React Query e reaproveitado (zero round-trip extra).
 */
function EqualizacaoCard({
  advogadas,
  ano,
}: {
  advogadas: Advogada[];
  ano: number | null;
}) {
  // Replica o queryKey e queryFn de useDistribuicaoSocia para casar com
  // o cache. Manter sincronizado com src/hooks/useVisaoGeralFinanceiro.ts.
  const queries = useQueries({
    queries: advogadas.map((a) => {
      const conta = contaKey(a);
      return {
        queryKey: ["distribuicao-socia-rpc", ano, conta],
        queryFn: async () => {
          const { data, error } = await (supabase as any).rpc("get_distribuicao_socia", {
            _ano: ano ?? null,
            _conta: conta,
          });
          if (error) throw error;
          const row = Array.isArray(data) ? data[0] : data;
          if (!row) return { liquido: 0 };
          return { liquido: Number(row.liquido) || 0 };
        },
        retry: false,
      };
    }),
  });

  const liquidos = useMemo(
    () =>
      advogadas.map((adv, i) => ({
        advogada: adv,
        liquido: queries[i]?.data?.liquido ?? null,
      })),
    [advogadas, queries],
  );

  const carregando = queries.some((q) => q.isLoading);
  if (carregando || liquidos.length < 2) return null;
  if (liquidos.some((l) => l.liquido === null)) return null;

  // Top e bottom por liquido.
  const ordenados = [...liquidos].sort(
    (a, b) => (b.liquido ?? 0) - (a.liquido ?? 0),
  );
  const top = ordenados[0];
  const bottom = ordenados[ordenados.length - 1];
  const diferenca = Math.abs((top.liquido ?? 0) - (bottom.liquido ?? 0));

  if (diferenca === 0) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(var(--chart-5))]/10">
            <ArrowRightLeft className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          </div>
          <div>
            <p className="font-medium">Equalização entre Sócias</p>
            <p className="text-sm text-muted-foreground">
              {top.advogada.nome_completo} recebeu{" "}
              <span className="font-semibold text-foreground">{fmt(diferenca)}</span> a mais que{" "}
              {bottom.advogada.nome_completo} no período.
            </p>
            <p className="text-sm text-muted-foreground">
              Transferir <span className="font-semibold text-foreground">{fmt(diferenca / 2)}</span> de{" "}
              {top.advogada.nome_completo} para {bottom.advogada.nome_completo} para equalizar.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DistribuicaoSociasTab({ ano }: Props) {
  const { data: advogadas, isLoading } = useAdvogadas();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const lista = advogadas ?? [];
  if (lista.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        Nenhuma advogada cadastrada (profiles.is_advogada = true).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lista.map((a) => (
          <SociaSection key={a.id} advogada={a} ano={ano} />
        ))}
      </div>

      <EqualizacaoCard advogadas={lista} ano={ano} />
    </div>
  );
}
