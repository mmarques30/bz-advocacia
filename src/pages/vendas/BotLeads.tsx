import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";
import { BotLeadsKPIs } from "@/components/bot/BotLeadsKPIs";
import { BotLeadsTable } from "@/components/bot/BotLeadsTable";
import { useBotLeads, useBotLeadsStats } from "@/hooks/useBotLeads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BotLeads() {
  const { data: leads, isLoading: leadsLoading, refetch } = useBotLeads();
  const { data: stats, isLoading: statsLoading } = useBotLeadsStats();
  const [filter, setFilter] = useState<'todos' | 'novos' | 'bot_completo' | 'qualificados'>('todos');

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('bot-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions',
          filter: 'origem=eq.whatsapp_bot',
        },
        (payload) => {
          console.log('Lead atualizado via realtime:', payload);
          refetch();
          if (payload.eventType === 'INSERT') {
            toast.success('Novo lead recebido via WhatsApp Bot!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filteredLeads = leads?.filter(lead => {
    if (filter === 'todos') return true;
    if (filter === 'novos') return lead.estagio === 'novo';
    if (filter === 'bot_completo') return lead.bot_finalizado;
    if (filter === 'qualificados') return lead.estagio === 'em_analise' || lead.estagio === 'proposta_enviada';
    return true;
  }) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Leads WhatsApp Bot</h1>
            <p className="text-muted-foreground">Gerencie leads recebidos via automação WhatsApp</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <BotLeadsKPIs 
        stats={stats || { totalBot: 0, botCompleto: 0, convertidos: 0, novosHoje: 0, taxaConversao: '0' }} 
        isLoading={statsLoading} 
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leads Recebidos</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'novos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('novos')}
              >
                Novos
              </Button>
              <Button
                variant={filter === 'bot_completo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('bot_completo')}
              >
                Bot Completo
              </Button>
              <Button
                variant={filter === 'qualificados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('qualificados')}
              >
                Qualificados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BotLeadsTable leads={filteredLeads} isLoading={leadsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
