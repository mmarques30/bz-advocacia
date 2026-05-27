import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMetasMensais } from "@/hooks/useMetasMensais";
import { useReceitasMesAtual } from "@/hooks/useFinanceiro";
import { ConfigurarMetaDialog } from "@/components/dashboard/ConfigurarMetaDialog";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const fmtBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Barra de meta do mês corrente: realizado (receitas do mês) vs meta
// configurada em metas_mensais. O dialog de configurar a meta é o mesmo
// usado no dashboard.
export function MetaMensalBar() {
  const { metas } = useMetasMensais();
  const { data: receitas } = useReceitasMesAtual();

  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const meta = metas.find((m) => m.mes === mes && m.ano === ano);
  const metaValor = meta?.valor ?? 0;
  const realizado = receitas?.totalGeral ?? 0;
  const pct = metaValor > 0 ? Math.min((realizado / metaValor) * 100, 100) : 0;
  const atingiu = metaValor > 0 && realizado >= metaValor;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Meta de {MESES[mes - 1]} {ano}
          </p>
          <p className="text-lg font-semibold">
            {fmtBRL(realizado)}
            {metaValor > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}de {fmtBRL(metaValor)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {metaValor > 0 && (
            <span
              className={`text-sm font-semibold ${atingiu ? "text-emerald-600" : "text-foreground"}`}
            >
              {pct.toFixed(0)}%
            </span>
          )}
          <ConfigurarMetaDialog />
        </div>
      </div>
      {metaValor > 0 ? (
        <Progress value={pct} className="mt-3" />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Nenhuma meta definida para este mês. Clique na engrenagem para configurar.
        </p>
      )}
    </Card>
  );
}
