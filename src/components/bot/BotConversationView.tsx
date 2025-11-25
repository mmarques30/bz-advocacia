import { useLeadInteracoes } from "@/hooks/useLeadInteracoes";
import { ConversaMensagem } from "@/types/bot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BotConversationViewProps {
  leadId: string;
  conversaCompleta: ConversaMensagem[] | null;
}

export function BotConversationView({ leadId, conversaCompleta }: BotConversationViewProps) {
  const { data: interacoes, isLoading } = useLeadInteracoes(leadId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Usar conversaCompleta se disponível, senão usar interacoes
  const mensagens = conversaCompleta || interacoes?.map(i => ({
    texto: i.mensagem,
    de_bot: i.eh_bot,
    timestamp: i.created_at,
  })) || [];

  if (mensagens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma conversa registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {mensagens.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${msg.de_bot ? 'justify-start' : 'justify-end'}`}
        >
          {msg.de_bot && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          )}
          <div
            className={`flex flex-col max-w-[70%] ${
              msg.de_bot
                ? 'bg-muted rounded-lg rounded-tl-none'
                : 'bg-primary text-primary-foreground rounded-lg rounded-tr-none'
            } p-3`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
            <span className={`text-xs mt-1 ${msg.de_bot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
              {format(new Date(msg.timestamp), "HH:mm", { locale: ptBR })}
            </span>
          </div>
          {!msg.de_bot && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
