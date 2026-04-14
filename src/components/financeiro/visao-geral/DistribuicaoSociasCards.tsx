import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDistribuicaoSocia } from "@/hooks/useVisaoGeralFinanceiro";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  ano: number | null;
}

function SociaCard({ nome, ano }: { nome: string; ano: number | null }) {
  const conta = nome.toLowerCase();
  const { data, isLoading } = useDistribuicaoSocia(ano, conta);

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Recebido</span>
          <span className="font-semibold text-primary">{fmt(data?.receitas || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Despesas PF</span>
          <span className="font-semibold text-destructive">{fmt(data?.despesasPF || 0)}</span>
        </div>
        <div className="border-t pt-1 flex justify-between text-sm font-bold">
          <span>Líquido</span>
          <span className={data?.liquido && data.liquido >= 0 ? "text-primary" : "text-destructive"}>
            {fmt(data?.liquido || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DistribuicaoSociasCards({ ano }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SociaCard nome="Eliziane" ano={ano} />
      <SociaCard nome="Juliana" ano={ano} />
    </div>
  );
}
