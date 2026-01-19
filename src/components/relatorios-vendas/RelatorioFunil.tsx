import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter } from "lucide-react";

interface FunilData {
  estagio: string;
  label: string;
  quantidade: number;
  percentual: number;
}

interface RelatorioFunilProps {
  funil: FunilData[] | undefined;
  isLoading: boolean;
}

export function RelatorioFunil({ funil, isLoading }: RelatorioFunilProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const colors = [
    "bg-blue-500",
    "bg-blue-400",
    "bg-amber-400",
    "bg-amber-500",
    "bg-green-500"
  ];

  const maxQuantidade = Math.max(...(funil?.map(f => f.quantidade) || [1]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Visualização do progresso dos leads por estágio
            </CardDescription>
          </div>
          <Filter className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {funil && funil.length > 0 ? (
          <div className="space-y-4">
            {funil.map((item, index) => {
              const widthPercentual = maxQuantidade > 0 ? (item.quantidade / maxQuantidade) * 100 : 0;
              
              return (
                <div key={item.estagio} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.quantidade} leads ({item.percentual.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className={`h-full ${colors[index]} transition-all duration-500 ease-out flex items-center justify-center`}
                      style={{ width: `${Math.max(widthPercentual, 5)}%` }}
                    >
                      {widthPercentual > 15 && (
                        <span className="text-white text-xs font-medium">
                          {item.quantidade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Legenda de conversão entre estágios */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Taxa de Perda por Estágio</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {funil.slice(0, -1).map((item, index) => {
                  const proximo = funil[index + 1];
                  const taxaPerda = item.quantidade > 0 
                    ? ((item.quantidade - proximo.quantidade) / item.quantidade) * 100 
                    : 0;
                  
                  return (
                    <div key={`perda-${item.estagio}`} className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">
                        {item.label} → {proximo.label}
                      </p>
                      <p className={`text-lg font-bold ${taxaPerda > 50 ? 'text-red-600' : taxaPerda > 25 ? 'text-amber-600' : 'text-green-600'}`}>
                        {taxaPerda.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
