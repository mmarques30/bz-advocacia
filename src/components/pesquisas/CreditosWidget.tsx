import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, AlertCircle } from "lucide-react";
import { useConsultasConfig } from "@/hooks/useConsultasConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreditosWidget() {
  const { config, isLoading } = useConsultasConfig();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Créditos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditos = config?.creditos_disponiveis || 0;
  const valorEstimado = creditos * 1.5; // Média de R$ 1,50 por crédito
  const alertaCreditos = creditos < 500;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Créditos Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-bold">{creditos.toLocaleString('pt-BR')}</div>
          <p className="text-sm text-muted-foreground">
            Valor estimado: R$ {valorEstimado.toFixed(2)}
          </p>
        </div>

        {alertaCreditos && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Créditos baixos. Considere recarregar.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Este mês:</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">47 consultas</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Custo total:</span>
            <span className="font-medium">R$ 94,50</span>
          </div>
        </div>

        <Button className="w-full" variant="outline" disabled>
          Comprar Mais Créditos
        </Button>
      </CardContent>
    </Card>
  );
}
