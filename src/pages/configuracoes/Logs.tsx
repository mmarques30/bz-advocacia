import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Logs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Logs do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Visualize o histórico de ações realizadas no sistema
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade está em desenvolvimento. Em breve você poderá visualizar todos os logs de auditoria do sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            Acompanhe todas as atividades realizadas no sistema
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
