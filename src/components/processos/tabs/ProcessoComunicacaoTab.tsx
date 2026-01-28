import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWhatsAppHistoricoProcesso } from "@/hooks/useWhatsAppHistorico";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { Send, CheckCircle, Clock, XCircle, Copy, MessageCircle, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { EnviarMensagemDialog } from "@/components/comunicacao/EnviarMensagemDialog";
import { TemplateCategoria } from "@/types/whatsapp";
import { toast } from "@/hooks/use-toast";

interface ProcessoComunicacaoTabProps {
  processoId: string;
  processo: any;
}

const categorias: { value: TemplateCategoria; label: string }[] = [
  { value: "andamento", label: "Andamento" },
  { value: "audiencia", label: "Audiência" },
  { value: "sentenca", label: "Sentença" },
  { value: "prazo", label: "Prazo" },
  { value: "documento", label: "Documento" },
  { value: "cobranca", label: "Cobrança" },
  { value: "geral", label: "Geral" },
];

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em Andamento",
  arquivado: "Arquivado",
  suspenso: "Suspenso",
  concluido: "Concluído",
  ativo: "Ativo",
};

export function ProcessoComunicacaoTab({ processoId, processo }: ProcessoComunicacaoTabProps) {
  const { data: historico = [] } = useWhatsAppHistoricoProcesso(processoId);
  const { data: allTemplates = [] } = useWhatsAppTemplates({ ativo: true });
  const [enviarDialogOpen, setEnviarDialogOpen] = useState(false);
  const [categoriaSelected, setCategoriaSelected] = useState<TemplateCategoria | "">("");
  const [templateId, setTemplateId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
      case 'entregue':
      case 'lido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'falhou':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Filter templates by selected category
  const templatesFiltered = useMemo(() => {
    if (!categoriaSelected) return [];
    return allTemplates.filter(t => t.categoria === categoriaSelected);
  }, [allTemplates, categoriaSelected]);

  // Get selected template
  const selectedTemplate = useMemo(() => {
    return allTemplates.find(t => t.id === templateId);
  }, [allTemplates, templateId]);

  // Process template variables with process/client data
  const processedMessage = useMemo(() => {
    if (!selectedTemplate) return "";
    
    let message = selectedTemplate.mensagem;
    
    // Replace variables with process and client data
    const variables: Record<string, string> = {
      "{{nome_cliente}}": processo.cliente?.nome_completo || "Cliente",
      "{{numero_processo}}": processo.numero_processo || "N/A",
      "{{tipo_processo}}": processo.tipo || "N/A",
      "{{status_processo}}": STATUS_LABELS[processo.status] || processo.status || "N/A",
      "{{tribunal}}": processo.tribunal || "N/A",
      "{{vara}}": processo.vara || "N/A",
      "{{comarca}}": processo.comarca || "N/A",
      "{{data_inicio}}": processo.data_inicio ? format(new Date(processo.data_inicio), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
      "{{data_ultima_atualizacao}}": processo.data_ultima_atualizacao ? format(new Date(processo.data_ultima_atualizacao), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
      "{{instancia}}": processo.instancia || "N/A",
      "{{autor}}": processo.autor || "N/A",
      "{{reu}}": processo.reu || "N/A",
    };

    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(key, "g"), value);
    });

    return message;
  }, [selectedTemplate, processo]);

  const handleCategoriaChange = (value: string) => {
    setCategoriaSelected(value as TemplateCategoria);
    setTemplateId(""); // Reset template when category changes
    setCopied(false);
  };

  const handleTemplateChange = (value: string) => {
    setTemplateId(value);
    setCopied(false);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    return `55${cleaned}`;
  };

  const handleCopyMessage = async () => {
    if (!processedMessage) return;
    
    try {
      await navigator.clipboard.writeText(processedMessage);
      setCopied(true);
      toast({
        title: "Mensagem copiada!",
        description: "A mensagem foi copiada para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleOpenWhatsApp = () => {
    if (!processedMessage || !processo.cliente?.telefone) return;
    
    const formattedPhone = formatPhoneForWhatsApp(processo.cliente.telefone);
    const encodedMessage = encodeURIComponent(processedMessage);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Quick Message Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Envio Rápido com Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <p className="text-sm font-medium">{processo.cliente?.nome_completo || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <p className="text-sm font-medium">{processo.cliente?.telefone || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status do Processo</Label>
              <Badge variant="outline" className="mt-1">
                {STATUS_LABELS[processo.status] || processo.status || "N/A"}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Última Atualização</Label>
              <p className="text-sm font-medium">
                {processo.data_ultima_atualizacao 
                  ? format(new Date(processo.data_ultima_atualizacao), "dd/MM/yyyy", { locale: ptBR })
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaSelected} onValueChange={handleCategoriaChange}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select 
                value={templateId} 
                onValueChange={handleTemplateChange}
                disabled={!categoriaSelected || templatesFiltered.length === 0}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={
                    !categoriaSelected 
                      ? "Selecione categoria primeiro" 
                      : templatesFiltered.length === 0 
                        ? "Nenhum template disponível" 
                        : "Selecione um template..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {templatesFiltered.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message Preview */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Label>Mensagem Personalizada</Label>
              <ScrollArea className="h-[120px] w-full rounded-md border bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap">{processedMessage}</p>
              </ScrollArea>
            </div>
          )}

          {/* Action Buttons */}
          {selectedTemplate && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCopyMessage}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Mensagem
                  </>
                )}
              </Button>
              <Button 
                onClick={handleOpenWhatsApp}
                disabled={!processo.cliente?.telefone}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Abrir WhatsApp
              </Button>
            </div>
          )}

          {!processo.cliente?.telefone && selectedTemplate && (
            <p className="text-sm text-destructive">
              ⚠️ Cliente não possui telefone cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification History */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Histórico de Notificações</h3>
            <p className="text-sm text-muted-foreground">
              {historico.length} mensagem(ns) enviada(s)
            </p>
          </div>
          <Button variant="outline" onClick={() => setEnviarDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Enviar via Sistema
          </Button>
        </div>

        {historico.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma notificação enviada para este processo
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {historico.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getStatusIcon(item.status)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.destinatario_nome}</span>
                        <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{item.mensagem}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EnviarMensagemDialog
        open={enviarDialogOpen}
        onOpenChange={setEnviarDialogOpen}
        processoId={processoId}
        processo={processo}
      />
    </div>
  );
}
