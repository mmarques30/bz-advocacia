import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Usuarios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os usuários e permissões do escritório
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta funcionalidade está em desenvolvimento. Em breve você poderá convidar e gerenciar usuários do seu escritório.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>
            Adicione colaboradores e defina suas permissões
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
