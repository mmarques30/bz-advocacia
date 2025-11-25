import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { TemplateCategoria } from "@/types/whatsapp";
import { WhatsAppTemplateCard } from "@/components/comunicacao/WhatsAppTemplateCard";
import { WhatsAppTemplateDialog } from "@/components/comunicacao/WhatsAppTemplateDialog";

export default function Templates() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<TemplateCategoria | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const { data: templates = [], isLoading } = useWhatsAppTemplates({
    busca,
    categoria: categoria === "todos" ? undefined : categoria,
  });

  const handleNew = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const categoriaCount = (cat: TemplateCategoria | "todos") => {
    if (cat === "todos") return templates.length;
    return templates.filter(t => t.categoria === cat).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie os templates de mensagens para notificações automáticas
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar templates..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={categoria} onValueChange={(v) => setCategoria(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos ({categoriaCount("todos")})</SelectItem>
            <SelectItem value="andamento">Andamentos ({categoriaCount("andamento")})</SelectItem>
            <SelectItem value="audiencia">Audiências ({categoriaCount("audiencia")})</SelectItem>
            <SelectItem value="sentenca">Sentenças ({categoriaCount("sentenca")})</SelectItem>
            <SelectItem value="documento">Documentos ({categoriaCount("documento")})</SelectItem>
            <SelectItem value="prazo">Prazos ({categoriaCount("prazo")})</SelectItem>
            <SelectItem value="geral">Geral ({categoriaCount("geral")})</SelectItem>
            <SelectItem value="cobranca">Cobrança ({categoriaCount("cobranca")})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum template encontrado
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <WhatsAppTemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <WhatsAppTemplateDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        template={editingTemplate}
      />
    </div>
  );
}
