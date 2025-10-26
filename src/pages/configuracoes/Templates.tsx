import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Templates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie templates de documentos e comunicações
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade está em desenvolvimento. Em breve você poderá criar e gerenciar templates personalizados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Templates de Documentos</CardTitle>
          <CardDescription>
            Crie templates reutilizáveis para agilizar seu trabalho
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
