import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationSummary {
  conversation_id: string;
  first_message: string;
  first_at: string;
  last_at: string;
}

interface ChatHistoryProps {
  conversations: ConversationSummary[];
  loading: boolean;
  activeConversationId: string;
  onSelect: (id: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function ChatHistory({ conversations, loading, activeConversationId, onSelect }: ChatHistoryProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 px-4">
        <MessageSquare className="h-8 w-8 opacity-40" />
        <p>Nenhuma conversa anterior</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {conversations.map((c) => (
        <button
          key={c.conversation_id}
          onClick={() => onSelect(c.conversation_id)}
          className={cn(
            "w-full text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-muted",
            c.conversation_id === activeConversationId && "bg-muted"
          )}
        >
          <p className="text-sm font-medium text-foreground truncate">
            {c.first_message || "Conversa sem título"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(c.last_at)}
          </p>
        </button>
      ))}
    </div>
  );
}
