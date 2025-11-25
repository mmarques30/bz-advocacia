import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction } from "lucide-react";

export default function Imoveis() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Consultar Imóvel</h1>
        <p className="text-muted-foreground mt-2">
          Busque informações sobre propriedades e registros imobiliários
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Consulta de Imóveis</CardTitle>
          <CardDescription>
            Busque informações sobre propriedades e registros imobiliários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Construction className="h-4 w-4" />
            <AlertDescription>
              Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
