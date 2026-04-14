import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDistribuicaoSocia } from "@/hooks/useVisaoGeralFinanceiro";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRightLeft } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  ano: number | null;
}

function SociaSection({ nome, ano }: { nome: string; ano: number | null }) {
  const { data, isLoading } = useDistribuicaoSocia(ano, nome.toLowerCase());

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-emerald-50">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="font-bold text-emerald-600">{fmt(data.receitas)}</p>
          </div>
          <div className="p-2 rounded bg-red-50">
            <p className="text-xs text-muted-foreground">Despesas PF</p>
            <p className="font-bold text-red-500">{fmt(data.despesasPF)}</p>
          </div>
          <div className="p-2 rounded bg-blue-50">
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className={`font-bold ${data.liquido >= 0 ? "text-blue-600" : "text-red-500"}`}>
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
                    <TableCell className="text-xs text-right text-emerald-600 font-medium">
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
                      <TableCell className="text-xs text-right text-red-500 font-medium">
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

export function DistribuicaoSociasTab({ ano }: Props) {
  const { data: eliziane } = useDistribuicaoSocia(ano, "eliziane");
  const { data: juliana } = useDistribuicaoSocia(ano, "juliana");

  const liqEliziane = eliziane?.liquido || 0;
  const liqJuliana = juliana?.liquido || 0;
  const diferenca = Math.abs(liqEliziane - liqJuliana);
  const quemRecebeuMais = liqEliziane > liqJuliana ? "Eliziane" : "Juliana";
  const quemRecebeuMenos = liqEliziane > liqJuliana ? "Juliana" : "Eliziane";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SociaSection nome="Eliziane" ano={ano} />
        <SociaSection nome="Juliana" ano={ano} />
      </div>

      {diferenca > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Equalização entre Sócias</p>
                <p className="text-sm text-muted-foreground">
                  {quemRecebeuMais} recebeu <span className="font-semibold text-foreground">{fmt(diferenca)}</span> a mais que {quemRecebeuMenos} no período.
                </p>
                <p className="text-sm text-muted-foreground">
                  Transferir <span className="font-semibold text-foreground">{fmt(diferenca / 2)}</span> de {quemRecebeuMais} para {quemRecebeuMenos} para equalizar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
