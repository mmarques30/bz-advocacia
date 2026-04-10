import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Configuracoes() {
  const configSections = [
    {
      title: "Cadastros",
      description: "Gerencie seu perfil e os usuários do escritório",
      icon: Users,
      href: "/dashboard/configuracoes/cadastros",
      color: "text-primary",
    },
    {
      title: "Modelos",
      description: "Configure modelos de mensagens e listas do sistema",
      icon: MessageSquare,
      href: "/dashboard/configuracoes/modelos",
      color: "text-secondary-foreground",
    },
    {
      title: "Controle",
      description: "Guia de uso, atualizações e automações",
      icon: Settings,
      href: "/dashboard/configuracoes/controle",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do seu escritório e perfil
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} to={section.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
