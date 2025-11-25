import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction } from "lucide-react";

export default function Imoveis() {
  return (
    <DashboardLayout title="Consultar Imóvel">
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
    </DashboardLayout>
  );
}
