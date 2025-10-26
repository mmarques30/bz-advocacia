import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template } from "@/hooks/useTemplates";

interface NewTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (template: Partial<Template>) => void;
  editingTemplate?: Template | null;
}

export function NewTemplateDialog({ open, onClose, onSubmit, editingTemplate }: NewTemplateDialogProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"documento" | "email" | "whatsapp" | "contrato">("documento");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [variaveis, setVariaveis] = useState("");

  useEffect(() => {
    if (editingTemplate) {
      setNome(editingTemplate.nome);
      setTipo(editingTemplate.tipo);
      setCategoria(editingTemplate.categoria || "");
      setDescricao(editingTemplate.descricao || "");
      setConteudo(editingTemplate.conteudo);
      setVariaveis(editingTemplate.variaveis?.join(", ") || "");
    } else {
      setNome("");
      setTipo("documento");
      setCategoria("");
      setDescricao("");
      setConteudo("");
      setVariaveis("");
    }
  }, [editingTemplate, open]);

  const handleSubmit = () => {
    const variaveisArray = variaveis
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);

    const templateData: Partial<Template> = {
      nome,
      tipo,
      categoria: categoria || undefined,
      descricao: descricao || undefined,
      conteudo,
      variaveis: variaveisArray,
      ativo: true,
    };

    if (editingTemplate) {
      onSubmit({ ...templateData, id: editingTemplate.id });
    } else {
      onSubmit(templateData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
          <DialogDescription>
            {editingTemplate ? "Edite as informações do template" : "Crie um novo template para documentos e comunicações"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Petição Inicial - Inventário"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Inventário, Divórcio"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do template"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variaveis">Variáveis (separadas por vírgula)</Label>
            <Input
              id="variaveis"
              value={variaveis}
              onChange={(e) => setVariaveis(e.target.value)}
              placeholder="Ex: nome_cliente, cpf, data, processo_numero"
            />
            <p className="text-xs text-muted-foreground">
              Use no conteúdo como: {`{{nome_cliente}}`}, {`{{cpf}}`}, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva o conteúdo do template aqui. Use {{variavel}} para campos dinâmicos."
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nome || !conteudo}>
            {editingTemplate ? "Salvar Alterações" : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
