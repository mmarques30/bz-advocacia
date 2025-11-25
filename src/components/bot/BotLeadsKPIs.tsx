import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BotLeadsKPIsProps {
  stats: {
    totalBot: number;
    botCompleto: number;
    convertidos: number;
    novosHoje: number;
    taxaConversao: string;
  };
  isLoading: boolean;
}

export function BotLeadsKPIs({ stats, isLoading }: BotLeadsKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total de Leads</span>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{stats.totalBot}</p>
          <p className="text-xs text-muted-foreground mt-1">Via WhatsApp Bot</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bot Completo</span>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{stats.botCompleto}</p>
          <p className="text-xs text-muted-foreground mt-1">Finalizaram conversa</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{stats.taxaConversao}%</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.convertidos} convertidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Novos Hoje</span>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{stats.novosHoje}</p>
          <p className="text-xs text-muted-foreground mt-1">Nas últimas 24h</p>
        </CardContent>
      </Card>
    </div>
  );
}
