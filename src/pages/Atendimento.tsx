import { useState } from "react";
import { ConversasList } from "@/components/atendimento/ConversasList";
import { ChatPanel } from "@/components/atendimento/ChatPanel";
import { MessageCircle } from "lucide-react";

export default function Atendimento() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <div className="border-b px-4 py-3 shrink-0">
        <h1 className="font-seasons text-2xl text-primary">Atendimento</h1>
        <p className="text-xs text-muted-foreground">
          Conversas ativas via WhatsApp — atendimento humano contínuo
        </p>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr] overflow-hidden">
        <ConversasList selectedId={selectedId} onSelect={setSelectedId} />
        {selectedId ? (
          <ChatPanel leadId={selectedId} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
            <MessageCircle className="h-12 w-12 opacity-30" />
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
