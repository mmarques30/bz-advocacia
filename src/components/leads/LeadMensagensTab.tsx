import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { useConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { processarTemplate } from "@/types/whatsapp";
import { openWhatsAppLink } from "@/lib/whatsappUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import { MessageCircle, Send, AlertCircle, Bot, User, Info, Cake } from "lucide-react";
import type { LeadInteracao } from "@/hooks/useLeadInteracoes";

interface LeadMensagensTabProps {
  leadId: string;
  telefone?: string;
  nomeCompleto?: string;
  email?: string;
  dataNascimento?: string | null;
}

export function LeadMensagensTab({ leadId, telefone, nomeCompleto, email, dataNascimento }: LeadMensagensTabProps) {
  const [mensagem, setMensagem] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const [hasUnfilledVars, setHasUnfilledVars] = useState(false);
  const queryClient = useQueryClient();
  const { configuracoes } = useConfiguracoesEscritorio();

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

  // Check if today is the client's birthday
  const isAniversarioHoje = (() => {
    if (!dataNascimento) return false;
    const today = new Date();
    const [, m, d] = dataNascimento.split('-').map(Number);
    return m === today.getMonth() + 1 && d === today.getDate();
  })();

  const handleEnviarParabens = () => {
    const anivTemplate = templates.find(t => (t as any).tipo === 'aniversario');
    if (anivTemplate) {
      handleTemplateSelect(anivTemplate.id);
    } else {
      setMensagem(`Feliz aniversário, ${nomeCompleto || ''}! 🎂🎉 Que este novo ano seja repleto de conquistas e realizações!`);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setHasUnfilledVars(false);
    if (templateId === "none") {
      setMensagem("");
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const dados: Record<string, string> = {
        nome_cliente: nomeCompleto || "",
        telefone_cliente: telefone || "",
        email_cliente: email || "",
        nome_escritorio: configuracoes?.nome_escritorio || "",
        telefone_escritorio: configuracoes?.telefone || "",
        email_escritorio: configuracoes?.email || "",
        nome_advogado: "",
      };

      let processed = processarTemplate(template.mensagem, dados);
      const remaining = /\{\{[^}]+\}\}/.test(processed);
      setHasUnfilledVars(remaining);
      processed = processed.replace(/\{\{[^}]+\}\}/g, "").replace(/\s{2,}/g, " ").trim();
      setMensagem(processed);
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
      setHasUnfilledVars(false);
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
      {/* Birthday banner */}
      {isAniversarioHoje && (
        <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            <p className="text-sm font-medium text-pink-700 dark:text-pink-300">
              Hoje é aniversário de {nomeCompleto}! 🎂
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleEnviarParabens} className="shrink-0 border-pink-300 text-pink-700 hover:bg-pink-100 dark:border-pink-700 dark:text-pink-300 dark:hover:bg-pink-900">
            Enviar parabéns
          </Button>
        </div>
      )}
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

        {hasUnfilledVars && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Algumas variáveis não foram preenchidas automaticamente</span>
          </div>
        )}

        <Button onClick={handleEnviar} disabled={enviando || !mensagem.trim()} className="w-full gap-2">
          <Send className="h-4 w-4" />
          Enviar via WhatsApp
        </Button>
      </div>
    </div>
  );
}
