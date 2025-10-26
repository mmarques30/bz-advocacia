import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateTemplate } from "@/hooks/useTemplates";
import { extractVariables } from "@/lib/templateVariables";
import TemplateEditor from "./TemplateEditor";
import type { Template } from "@/types/templates";
import { useEffect } from "react";

const templateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tipo: z.enum(['contrato', 'procuracao', 'peticao', 'email', 'documento', 'comunicacao']),
  categoria: z.string().optional(),
  conteudo: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
  descricao: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EditTemplateDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTemplateDialog({ template, open, onOpenChange }: EditTemplateDialogProps) {
  const updateTemplate = useUpdateTemplate();
  
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
  });

  useEffect(() => {
    if (template) {
      form.reset({
        nome: template.nome,
        tipo: template.tipo,
        categoria: template.categoria || '',
        conteudo: template.conteudo,
        descricao: template.descricao || '',
      });
    }
  }, [template, form]);

  const onSubmit = async (data: TemplateFormData) => {
    if (!template) return;
    
    const variaveis = extractVariables(data.conteudo);
    await updateTemplate.mutateAsync({
      id: template.id,
      ...data,
      variaveis,
    });
    onOpenChange(false);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Template *</Label>
              <Input
                id="nome"
                {...form.register("nome")}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={form.watch("tipo")}
                onValueChange={(value) => form.setValue("tipo", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="procuracao">Procuração</SelectItem>
                  <SelectItem value="peticao">Petição</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="comunicacao">Comunicação</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipo && (
                <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              {...form.register("categoria")}
              placeholder="Ex: Direito de Família, Direito Trabalhista..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...form.register("descricao")}
              placeholder="Breve descrição sobre o template..."
              rows={2}
            />
          </div>

          <TemplateEditor
            value={form.watch("conteudo")}
            onChange={(value) => form.setValue("conteudo", value)}
            id="edit-conteudo"
          />
          {form.formState.errors.conteudo && (
            <p className="text-sm text-destructive">{form.formState.errors.conteudo.message}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
