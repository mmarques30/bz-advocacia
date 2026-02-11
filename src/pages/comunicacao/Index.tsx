import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWhatsAppStats } from "@/hooks/useWhatsAppHistorico";
import { MessageSquare, Send, Check, CheckCheck, XCircle, Clock } from "lucide-react";

export default function ComunicacaoIndex() {
  const { data: stats } = useWhatsAppStats();

  const kpis = [
    {
      title: "Total Enviadas",
      value: stats?.total || 0,
      icon: Send,
      color: "text-primary",
    },
    {
      title: "Entregues",
      value: stats?.entregues || 0,
      percentage: stats?.total ? ((stats.entregues / stats.total) * 100).toFixed(1) : '0',
      icon: Check,
      color: "text-primary",
    },
    {
      title: "Lidas",
      value: stats?.lidos || 0,
      percentage: stats?.total ? ((stats.lidos / stats.total) * 100).toFixed(1) : '0',
      icon: CheckCheck,
      color: "text-secondary-foreground",
    },
    {
      title: "Falhas",
      value: stats?.falhas || 0,
      percentage: stats?.total ? ((stats.falhas / stats.total) * 100).toFixed(1) : '0',
      icon: XCircle,
      color: "text-destructive",
    },
    {
      title: "Pendentes",
      value: stats?.pendentes || 0,
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Comunicação com Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie notificações automáticas via WhatsApp
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.percentage && (
                  <p className="text-xs text-muted-foreground">
                    {kpi.percentage}% do total
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Como funciona?</h3>
              <p className="text-sm text-muted-foreground">
                O sistema envia notificações automáticas via WhatsApp para seus clientes sobre andamentos processuais, 
                reduzindo a ansiedade e liberando tempo da sua equipe.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">1. Personalize</h4>
                <p className="text-xs text-muted-foreground">
                  Crie templates de mensagens e regras de envio automático
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">2. Automatize</h4>
                <p className="text-xs text-muted-foreground">
                  O sistema envia notificações automaticamente quando há novidades
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
