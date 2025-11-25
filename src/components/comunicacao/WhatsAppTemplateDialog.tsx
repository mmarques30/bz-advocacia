import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppTemplate, TemplateCategoria, VARIAVEIS_DISPONIVEIS, extrairVariaveis, processarTemplate } from "@/types/whatsapp";
import { useCreateWhatsAppTemplate, useUpdateWhatsAppTemplate } from "@/hooks/useWhatsAppTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface WhatsAppTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WhatsAppTemplate | null;
}

export function WhatsAppTemplateDialog({ open, onOpenChange, template }: WhatsAppTemplateDialogProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<TemplateCategoria>("geral");
  const [mensagem, setMensagem] = useState("");

  const createTemplate = useCreateWhatsAppTemplate();
  const updateTemplate = useUpdateWhatsAppTemplate();

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setCategoria(template.categoria);
      setMensagem(template.mensagem);
    } else {
      setNome("");
      setCategoria("geral");
      setMensagem("");
    }
  }, [template, open]);

  const handleSave = () => {
    const variaveis = extrairVariaveis(mensagem);

    if (template) {
      updateTemplate.mutate({
        id: template.id,
        nome,
        categoria,
        mensagem,
        variaveis,
      }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createTemplate.mutate({
        nome,
        categoria,
        mensagem,
        variaveis,
        ativo: true,
      }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const inserirVariavel = (variavel: string) => {
    const textarea = document.querySelector('textarea[name="mensagem"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = mensagem;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setMensagem(before + `{{${variavel}}}` + after);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variavel.length + 4, start + variavel.length + 4);
      }, 0);
    }
  };

  const preview = processarTemplate(mensagem, {
    nome_cliente: "Maria Silva",
    numero_processo: "001234/2024",
    tipo_processo: "Divórcio Consensual",
    data_andamento: "15/12/2024",
    descricao_andamento: "Audiência de conciliação designada",
    data_audiencia: "15/12/2024",
    hora_audiencia: "14:00",
    local_audiencia: "Fórum Central - Sala 3",
    resultado_sentenca: "Procedente",
    nome_escritorio: "Borges & Zembruski Advocacia",
    nome_advogado: "Dr. João Silva",
    descricao_prazo: "Manifestação sobre contestação",
    data_prazo: "20/12/2024",
    nome_documento: "Petição Inicial",
    tipo_documento: "Petição",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Template *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Novo Andamento Processual"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as TemplateCategoria)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="andamento">Andamento Processual</SelectItem>
                  <SelectItem value="audiencia">Audiência</SelectItem>
                  <SelectItem value="sentenca">Sentença</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="prazo">Prazo</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                name="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite a mensagem do template..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {mensagem.length} / 1000 caracteres
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Variáveis Disponíveis</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                {Object.entries(VARIAVEIS_DISPONIVEIS).map(([key, label]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto py-2"
                    onClick={() => inserirVariavel(key)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    <div className="text-left">
                      <div className="font-mono text-xs">{`{{${key}}}`}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {preview || "Digite uma mensagem para ver a prévia..."}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Variáveis Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                {extrairVariaveis(mensagem).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {extrairVariaveis(mensagem).map((v) => (
                      <Badge key={v} variant="secondary" className="font-mono text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma variável detectada
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!nome || !mensagem || createTemplate.isPending || updateTemplate.isPending}
          >
            Salvar Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
