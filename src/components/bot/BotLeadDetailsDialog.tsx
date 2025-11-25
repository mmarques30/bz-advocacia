import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadBot } from "@/types/bot";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LEAD_STATUS_LABELS, ORIGEM_LABELS } from "@/types/leads";
import { BotConversationView } from "./BotConversationView";
import { MessageCircle, User, Calendar, Tag, BarChart } from "lucide-react";

interface BotLeadDetailsDialogProps {
  lead: LeadBot;
  open: boolean;
  onClose: () => void;
}

export function BotLeadDetailsDialog({ lead, open, onClose }: BotLeadDetailsDialogProps) {
  const getOrigemColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: 'bg-blue-100 text-blue-800 border-blue-200',
      meta: 'bg-purple-100 text-purple-800 border-purple-200',
      indicacao: 'bg-green-100 text-green-800 border-green-200',
      whatsapp_bot: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      site: 'bg-gray-100 text-gray-800 border-gray-200',
      outro: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[origem] || colors.outro;
  };

  const getEstagioColor = (estagio: string) => {
    const colors: Record<string, string> = {
      novo: 'bg-blue-100 text-blue-800 border-blue-200',
      contato_inicial: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      proposta_enviada: 'bg-orange-100 text-orange-800 border-orange-200',
      fechado: 'bg-green-100 text-green-800 border-green-200',
      perdido: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estagio] || colors.novo;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.nome_completo}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="conversa">Conversa Bot</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="text-sm">{lead.telefone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{lead.email || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Área Jurídica</label>
                <p className="text-sm">{lead.tipo_processo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Origem</label>
                <Badge variant="outline" className={getOrigemColor(lead.origem)}>
                  {ORIGEM_LABELS[lead.origem as keyof typeof ORIGEM_LABELS] || lead.origem}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                  {LEAD_STATUS_LABELS[lead.estagio as keyof typeof LEAD_STATUS_LABELS]}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bot Completo</label>
                <Badge
                  variant="outline"
                  className={
                    lead.bot_finalizado
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                >
                  {lead.bot_finalizado ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4" />
                Descrição do Caso
              </label>
              <p className="text-sm bg-muted p-3 rounded-md">{lead.mensagem}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Primeiro Contato
                </label>
                <p className="text-sm">
                  {format(new Date(lead.primeiro_contato_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Último Contato
                </label>
                <p className="text-sm">
                  {format(new Date(lead.ultimo_contato_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Perguntas Respondidas
                </label>
                <p className="text-sm">{lead.perguntas_respondidas}</p>
              </div>
            </div>

            {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  UTM Parameters
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {lead.utm_source && (
                    <div className="text-sm">
                      <span className="font-medium">Source:</span> {lead.utm_source}
                    </div>
                  )}
                  {lead.utm_medium && (
                    <div className="text-sm">
                      <span className="font-medium">Medium:</span> {lead.utm_medium}
                    </div>
                  )}
                  {lead.utm_campaign && (
                    <div className="text-sm">
                      <span className="font-medium">Campaign:</span> {lead.utm_campaign}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversa">
            <BotConversationView leadId={lead.id} conversaCompleta={lead.conversa_bot_completa} />
          </TabsContent>

          <TabsContent value="historico">
            <div className="text-center py-8 text-muted-foreground">
              <p>Histórico de interações será exibido aqui</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
