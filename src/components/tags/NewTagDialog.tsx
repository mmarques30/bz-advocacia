import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/hooks/useTags";

interface NewTagDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tag: Partial<Tag>) => void;
  editingTag?: Tag | null;
}

const cores = [
  { label: "Vermelho", value: "#EF4444" },
  { label: "Laranja", value: "#F97316" },
  { label: "Amarelo", value: "#EAB308" },
  { label: "Verde", value: "#22C55E" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Roxo", value: "#A855F7" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Cinza", value: "#6B7280" },
];

export function NewTagDialog({ open, onClose, onSubmit, editingTag }: NewTagDialogProps) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(cores[0].value);
  const [tipo, setTipo] = useState<"lead" | "processo" | "geral">("geral");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (editingTag) {
      setNome(editingTag.nome);
      setCor(editingTag.cor);
      setTipo(editingTag.tipo);
      setDescricao(editingTag.descricao || "");
    } else {
      setNome("");
      setCor(cores[0].value);
      setTipo("geral");
      setDescricao("");
    }
  }, [editingTag, open]);

  const handleSubmit = () => {
    const tagData: Partial<Tag> = {
      nome,
      cor,
      tipo,
      descricao: descricao || undefined,
    };

    if (editingTag) {
      onSubmit({ ...tagData, id: editingTag.id });
    } else {
      onSubmit(tagData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTag ? "Editar Tag" : "Nova Tag"}</DialogTitle>
          <DialogDescription>
            {editingTag ? "Edite as informações da tag" : "Crie uma nova tag para organizar leads e processos"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Tag *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Urgente, VIP, Complexo"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <RadioGroup value={tipo} onValueChange={(value: any) => setTipo(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lead" id="lead" />
                <Label htmlFor="lead" className="cursor-pointer">Lead</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="processo" id="processo" />
                <Label htmlFor="processo" className="cursor-pointer">Processo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="geral" id="geral" />
                <Label htmlFor="geral" className="cursor-pointer">Geral</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Cor *</Label>
            <div className="grid grid-cols-4 gap-2">
              {cores.map((c) => (
                <Button
                  key={c.value}
                  type="button"
                  variant={cor === c.value ? "default" : "outline"}
                  className="h-10"
                  style={{
                    backgroundColor: cor === c.value ? c.value : undefined,
                    borderColor: c.value,
                  }}
                  onClick={() => setCor(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição da tag"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div>
              <Badge style={{ backgroundColor: cor }} className="text-white">
                {nome || "Nome da Tag"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nome}>
            {editingTag ? "Salvar Alterações" : "Criar Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
