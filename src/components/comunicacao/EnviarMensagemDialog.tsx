import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnviarWhatsApp } from "@/hooks/useWhatsAppEnvio";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";
import { useConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { TemplateCategoria } from "@/types/whatsapp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { openWhatsAppLink } from "@/lib/whatsappUtils";

interface EnviarMensagemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function EnviarMensagemDialog({ open, onOpenChange, processoId, processo }: EnviarMensagemDialogProps) {
  const [categoriaSelected, setCategoriaSelected] = useState<TemplateCategoria | "">("");
  const [templateId, setTemplateId] = useState<string>("");
  const enviarWhatsApp = useEnviarWhatsApp();
  const { data: whatsAppConfig } = useWhatsAppConfig();
  const { configuracoes } = useConfiguracoesEscritorio();

  const { data: allTemplates = [] } = useWhatsAppTemplates({ ativo: true });
  
  const hasActiveConfig = !!whatsAppConfig?.active;

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
    
    // Replace variables
    const now = new Date();
    const variables: Record<string, string> = {
      // Cliente
      "{{nome_cliente}}": processo.cliente?.nome_completo || "Cliente",
      "{{cpf_cliente}}": processo.cliente?.cpf || "",
      "{{email_cliente}}": processo.cliente?.email || "",
      "{{telefone_cliente}}": processo.cliente?.telefone || "",
      "{{endereco_cliente}}": processo.cliente?.endereco_completo || "",
      // Processo
      "{{numero_processo}}": processo.numero_processo || "N/A",
      "{{tipo_processo}}": processo.tipo || "N/A",
      "{{status_processo}}": processo.status || "N/A",
      "{{tribunal}}": processo.tribunal || "N/A",
      "{{vara}}": processo.vara || "N/A",
      "{{comarca}}": processo.comarca || "N/A",
      "{{data_inicio}}": processo.data_inicio ? new Date(processo.data_inicio).toLocaleDateString("pt-BR") : "N/A",
      // Escritório
      "{{nome_escritorio}}": configuracoes?.nome_escritorio || "BZ Advocacia",
      "{{telefone_escritorio}}": configuracoes?.telefone || "",
      "{{email_escritorio}}": configuracoes?.email || "",
      "{{cnpj_escritorio}}": configuracoes?.cnpj || "",
      "{{oab_escritorio}}": configuracoes?.oab_principal || "",
      "{{endereco_escritorio}}": configuracoes?.endereco_completo || "",
      // Advogado
      "{{nome_advogado}}": processo.responsavel?.nome_completo || "Advogado(a) Responsável",
      // Sistema
      "{{data_atual}}": now.toLocaleDateString("pt-BR"),
      "{{hora_atual}}": now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      // Contextuais (limpar para não exibir tags)
      "{{descricao_andamento}}": "",
      "{{data_andamento}}": "",
      "{{data_audiencia}}": "",
      "{{hora_audiencia}}": "",
      "{{local_audiencia}}": "",
      "{{resultado_sentenca}}": "",
      "{{descricao_prazo}}": "",
      "{{data_prazo}}": "",
      "{{prazo_vencimento}}": "",
      "{{nome_documento}}": "",
      "{{tipo_documento}}": "",
      "{{valor_devido}}": "",
    };

    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(key, "g"), value);
    });

    return message;
  }, [selectedTemplate, processo, configuracoes]);

  const handleCategoriaChange = (value: string) => {
    setCategoriaSelected(value as TemplateCategoria);
    setTemplateId(""); // Reset template when category changes
  };

  const handleEnviar = () => {
    if (!processedMessage) return;

    enviarWhatsApp.mutate({
      destinatario_telefone: processo.cliente?.telefone || "",
      destinatario_nome: processo.cliente?.nome_completo || "",
      mensagem: processedMessage,
      processo_id: processoId,
      cliente_id: processo.lead_id,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setCategoriaSelected("");
        setTemplateId("");
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setCategoriaSelected("");
    setTemplateId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Notificação WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
          </div>

          {/* Category Select */}
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

          {/* Template Select */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select 
              value={templateId} 
              onValueChange={setTemplateId}
              disabled={!categoriaSelected || templatesFiltered.length === 0}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder={
                  !categoriaSelected 
                    ? "Selecione uma categoria primeiro" 
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

          {/* Message Preview */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Label>Preview da Mensagem</Label>
              <ScrollArea className="h-[150px] w-full rounded-md border bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap">{processedMessage}</p>
              </ScrollArea>
            </div>
          )}

          {/* WhatsApp config warning */}
          {!hasActiveConfig && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Integração WhatsApp não configurada. Configure em Configurações → Automações antes de enviar.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {selectedTemplate && processo.cliente?.telefone && (
              <Button
                variant="outline"
                className="gap-2 text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => openWhatsAppLink(processo.cliente.telefone, processedMessage)}
              >
                <MessageCircle className="h-4 w-4" />
                Abrir no WhatsApp
              </Button>
            )}
            <Button 
              onClick={handleEnviar} 
              disabled={!selectedTemplate || !processedMessage || enviarWhatsApp.isPending || !hasActiveConfig}
            >
              {enviarWhatsApp.isPending ? "Enviando..." : "Enviar Agora"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
