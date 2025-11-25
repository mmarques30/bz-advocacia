import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDespesasPorCategoria } from "@/hooks/useDespesas";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";

export function RelatorioDespesasCategoria() {
  const { data: despesasPorCategoria } = useDespesasPorCategoria();

  const totalGeral = despesasPorCategoria?.reduce((sum, item) => sum + item.total, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Geral de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(totalGeral)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {despesasPorCategoria?.map((item) => (
              <div key={item.categoria} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {CATEGORIA_DESPESA_LABELS[item.categoria]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} despesa(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(item.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-destructive h-2 rounded-full transition-all"
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>
              </div>
            ))}
            {!despesasPorCategoria || despesasPorCategoria.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma despesa registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
