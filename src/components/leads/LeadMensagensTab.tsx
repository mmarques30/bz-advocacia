import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { openWhatsAppLink } from "@/lib/whatsappUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageCircle, Send, AlertCircle, Bot, User } from "lucide-react";
import type { LeadInteracao } from "@/hooks/useLeadInteracoes";

interface LeadMensagensTabProps {
  leadId: string;
  telefone?: string;
}

export function LeadMensagensTab({ leadId, telefone }: LeadMensagensTabProps) {
  const [mensagem, setMensagem] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const queryClient = useQueryClient();

  const { data: interacoes = [], isLoading } = useQuery({
    queryKey: ['lead-interacoes-whatsapp', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as LeadInteracao[];
    },
    enabled: !!leadId,
  });

  const { data: templates = [] } = useWhatsAppTemplates({ ativo: true });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "none") {
      setMensagem("");
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMensagem(template.mensagem);
    }
  };

  const handleEnviar = async () => {
    if (!mensagem.trim()) {
      toast({ title: "Digite uma mensagem", variant: "destructive" });
      return;
    }
    if (!telefone) {
      toast({ title: "WhatsApp não cadastrado para este lead", variant: "destructive" });
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase.from('lead_interacoes').insert({
        lead_id: leadId,
        tipo: 'whatsapp',
        canal: 'whatsapp',
        direcao: 'saida',
        mensagem: mensagem.trim(),
        eh_bot: false,
      });
      if (error) throw error;

      openWhatsAppLink(telefone, mensagem.trim());

      queryClient.invalidateQueries({ queryKey: ['lead-interacoes-whatsapp', leadId] });
      setMensagem("");
      setSelectedTemplate("");
      toast({ title: "Mensagem registrada e WhatsApp aberto" });
    } catch {
      toast({ title: "Erro ao registrar mensagem", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  if (!telefone) {
    return (
      <div className="text-center py-8 space-y-2">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">WhatsApp não cadastrado para este lead</p>
        <p className="text-xs text-muted-foreground">Edite o lead e adicione um número de telefone</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Histórico */}
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : interacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem registrada</p>
        ) : (
          interacoes.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
                  msg.direcao === 'saida'
                    ? 'bg-primary/10 text-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.eh_bot ? (
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  ) : msg.direcao === 'saida' ? (
                    <User className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {msg.canal}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.created_at), "dd/MM/yy HH:mm")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.mensagem}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composição */}
      <div className="space-y-3 border rounded-lg p-3">
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar modelo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem modelo</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Digite sua mensagem..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
        />

        <Button onClick={handleEnviar} disabled={enviando || !mensagem.trim()} className="w-full gap-2">
          <Send className="h-4 w-4" />
          Enviar via WhatsApp
        </Button>
      </div>
    </div>
  );
}
