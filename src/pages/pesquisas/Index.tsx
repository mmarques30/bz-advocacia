import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Scale, Building2, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Por enquanto so mantemos a consulta gratuita (BrasilAPI). As demais
// (Datajud / Apify) dependem de assinaturas pagas — quando contratadas,
// reabilita as entradas no sidebar (AppSidebar.tsx) e neste array.
const consultas = [
  {
    icon: Building2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    titulo: "Consultar Empresa",
    descricao: "Situação cadastral, sócios, atividades e endereço de empresas brasileiras",
    api: "BrasilAPI (gratuita)",
    url: "/dashboard/pesquisas/cnpj",
    buttonVariant: "default" as const,
  },
  {
    icon: History,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    titulo: "Histórico de Consultas",
    descricao: "Visualize todas as consultas realizadas anteriormente com seus resultados",
    api: "—",
    url: "/dashboard/pesquisas/historico",
    buttonVariant: "outline" as const,
  },
];

export default function PesquisasIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Pesquisas e Consultas</h1>
        <p className="text-muted-foreground mt-2">
          Sistema de consultas de dados para investigação processual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {consultas.map((consulta) => (
              <div
                key={consulta.titulo}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Ícone */}
                <div className={`p-3 rounded-lg ${consulta.iconBg} shrink-0`}>
                  <consulta.icon className={`h-5 w-5 ${consulta.iconColor}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{consulta.titulo}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {consulta.descricao}
                  </p>
                </div>

                {/* API/Fonte */}
                <div className="hidden md:block text-sm text-muted-foreground shrink-0 w-40">
                  {consulta.api}
                </div>

                {/* Botão */}
                <Button asChild variant={consulta.buttonVariant} size="sm" className="shrink-0">
                  <Link to={consulta.url} className="gap-2">
                    {consulta.buttonVariant === "outline" ? "Ver" : "Consultar"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
