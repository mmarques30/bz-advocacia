import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Tags() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="text-muted-foreground mt-2">
          Organize leads e processos com tags personalizadas
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade está em desenvolvimento. Em breve você poderá criar e gerenciar tags para organizar melhor seus dados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Tags</CardTitle>
          <CardDescription>
            Crie categorias personalizadas para organizar informações
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
