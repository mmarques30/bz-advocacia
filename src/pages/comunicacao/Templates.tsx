import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useWhatsAppTemplates, useDeleteWhatsAppTemplate, useToggleWhatsAppTemplateStatus } from "@/hooks/useWhatsAppTemplates";
import { TemplateCategoria, TemplateTipo } from "@/types/whatsapp";
import { WhatsAppTemplateDialog } from "@/components/comunicacao/WhatsAppTemplateDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const categoriasLabels: Record<TemplateCategoria, string> = {
  andamento: "Andamento",
  audiencia: "Audiência",
  sentenca: "Sentença",
  documento: "Documento",
  prazo: "Prazo",
  geral: "Geral",
  cobranca: "Cobrança",
};

const tipoLabels: Record<TemplateTipo, string> = {
  primeiro_contato: "Primeiro Contato",
  follow_up: "Follow-up",
  proposta: "Proposta",
  geral: "Geral",
};

export default function Templates() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<TemplateCategoria | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useWhatsAppTemplates({
    busca,
    categoria: categoria === "todos" ? undefined : categoria,
  });

  const deleteTemplate = useDeleteWhatsAppTemplate();
  const toggleStatus = useToggleWhatsAppTemplateStatus();

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

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatus.mutate({ id, ativo: !currentStatus });
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoriasLabels[template.categoria] || template.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tipoLabels[(template as any).tipo] || "Geral"}
                    </Badge>
                  <TableCell>
                    <Badge variant={template.ativo ? "default" : "secondary"}>
                      {template.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(template.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(template.id, template.ativo)}>
                          {template.ativo ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <WhatsAppTemplateDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        template={editingTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
