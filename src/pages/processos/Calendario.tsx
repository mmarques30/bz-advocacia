import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function ProcessosCalendario() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário de Processos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize os prazos em formato de calendário
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade está em desenvolvimento. Em breve você poderá visualizar todos os prazos em um calendário interativo.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Calendário de Prazos</CardTitle>
          <CardDescription>
            Visualização mensal dos prazos processuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidade disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
