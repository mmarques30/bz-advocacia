import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Scale, Building2, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function PesquisasIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pesquisas e Consultas</h1>
        <p className="text-muted-foreground mt-2">
          Sistema de consultas de dados para investigação processual
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Consultar Processo */}
        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Consultar Processo</CardTitle>
                <CardDescription>
                  Via API Datajud (CNJ)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulte dados públicos de processos judiciais de todos os tribunais brasileiros.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/pesquisas/processos">Consultar</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Consultar Pessoa */}
        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <User className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">Consultar Pessoa</CardTitle>
                <CardDescription>
                  Via Apify (Receita Federal)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulte situação cadastral de CPF diretamente na Receita Federal.
            </p>
            <Button asChild className="w-full bg-green-500 hover:bg-green-600">
              <Link to="/dashboard/pesquisas/cpf">Consultar</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Consultar Empresa */}
        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Consultar Empresa</CardTitle>
                <CardDescription>
                  Via BrasilAPI (CNPJ)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulte situação cadastral, sócios, atividades e endereço de empresas brasileiras.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/pesquisas/cnpj">Consultar</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <History className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Histórico</CardTitle>
                <CardDescription>
                  Consultas realizadas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize todas as consultas realizadas anteriormente com seus resultados.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/dashboard/pesquisas/historico">Ver Histórico</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
