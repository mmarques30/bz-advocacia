import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversasList } from "@/components/atendimento/ConversasList";
import { ChatPanel } from "@/components/atendimento/ChatPanel";
import { LeadInfoPanel } from "@/components/atendimento/LeadInfoPanel";
import { MessageCircle } from "lucide-react";

export default function Atendimento() {
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mensagemInicial, setMensagemInicial] = useState<string>("");

  // Deep-link: /dashboard/atendimento?lead=<lead_geral_id>&msg=<texto>
  // Usado pelo botao "Enviar parabens" (aniversariantes) e icone WhatsApp
  // da tabela de clientes. Limpa os params depois de aplicar pra nao
  // reaplicar em refresh.
  useEffect(() => {
    const lead = params.get("lead");
    const msg = params.get("msg");
    if (lead) {
      setSelectedId(lead);
      if (msg) setMensagemInicial(msg);
      const next = new URLSearchParams(params);
      next.delete("lead");
      next.delete("msg");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[calc(100vh-6.5rem)] min-h-0 flex flex-col overflow-hidden">
      <div className="border-b px-4 py-3 shrink-0">
        <h1 className="font-seasons text-2xl text-primary">Atendimento</h1>
        <p className="text-xs text-muted-foreground">
          Conversas ativas via WhatsApp — atendimento humano contínuo
        </p>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[320px_minmax(0,1fr)_320px] overflow-hidden">
        <ConversasList selectedId={selectedId} onSelect={setSelectedId} />
        {selectedId ? (
          <>
            <ChatPanel leadId={selectedId} mensagemInicial={mensagemInicial} />
            <LeadInfoPanel leadId={selectedId} />
          </>
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
            <MessageCircle className="h-12 w-12 opacity-30" />
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
