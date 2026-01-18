import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, FileText, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function Configuracoes() {
  const configSections = [
    {
      title: "Meu Perfil",
      description: "Gerencie suas informações pessoais e preferências",
      icon: User,
      href: "/dashboard/configuracoes/perfil",
      color: "text-primary",
    },
    {
      title: "Usuários",
      description: "Gerencie usuários e permissões do escritório",
      icon: Users,
      href: "/dashboard/configuracoes/usuarios",
      color: "text-blue-600",
    },
    {
      title: "Templates",
      description: "Gerencie templates de documentos e comunicações",
      icon: FileText,
      href: "/dashboard/configuracoes/templates",
      color: "text-green-600",
    },
    {
      title: "Templates WhatsApp",
      description: "Configure templates de mensagens do WhatsApp",
      icon: MessageSquare,
      href: "/dashboard/configuracoes/whatsapp-templates",
      color: "text-emerald-600",
    },
    {
      title: "Guia de Uso",
      description: "Aprenda a utilizar todas as funcionalidades do sistema",
      icon: BookOpen,
      href: "/dashboard/configuracoes/guia",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
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
