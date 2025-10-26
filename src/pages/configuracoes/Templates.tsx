import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useTemplates, useDuplicateTemplate, useToggleTemplateStatus } from "@/hooks/useTemplates";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateFilters from "@/components/templates/TemplateFilters";
import NewTemplateDialog from "@/components/templates/NewTemplateDialog";
import EditTemplateDialog from "@/components/templates/EditTemplateDialog";
import TemplatePreviewDialog from "@/components/templates/TemplatePreviewDialog";
import type { Template, TemplateFilters as Filters, TemplateType } from "@/types/templates";

export default function Templates() {
  const [filters, setFilters] = useState<Filters>({
    busca: '',
    tipo: [],
    ativo: true,
    ordenacao: 'recente',
  });
  const [activeTab, setActiveTab] = useState<'todos' | TemplateType>('todos');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const appliedFilters = {
    ...filters,
    tipo: activeTab === 'todos' ? filters.tipo : [activeTab, ...(filters.tipo || [])],
  };

  const { data: templates = [], isLoading } = useTemplates(appliedFilters);
  const duplicateTemplate = useDuplicateTemplate();
  const toggleStatus = useToggleTemplateStatus();

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id);
  };

  const handleToggleStatus = (id: string, ativo: boolean) => {
    toggleStatus.mutate({ id, ativo });
  };

  const getTemplateCountByType = (tipo: TemplateType | 'todos') => {
    if (tipo === 'todos') return templates.length;
    return templates.filter(t => t.tipo === tipo).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie templates de documentos e comunicações
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <TemplateFilters filters={filters} onFiltersChange={setFilters} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="todos" className="relative">
            Todos
            {getTemplateCountByType('todos') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('todos')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contrato">
            Contratos
            {getTemplateCountByType('contrato') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('contrato')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="procuracao">
            Procurações
            {getTemplateCountByType('procuracao') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('procuracao')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="peticao">
            Petições
            {getTemplateCountByType('peticao') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('peticao')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="email">
            Emails
            {getTemplateCountByType('email') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('email')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documento">
            Documentos
            {getTemplateCountByType('documento') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('documento')}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="comunicacao">
            Comunicações
            {getTemplateCountByType('comunicacao') > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {getTemplateCountByType('comunicacao')}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-6">
                {filters.busca || filters.tipo?.length || filters.categoria
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro template para começar"}
              </p>
              {!filters.busca && !filters.tipo?.length && !filters.categoria && (
                <Button onClick={() => setNewDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onPreview={handlePreview}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewTemplateDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
      />

      <EditTemplateDialog
        template={selectedTemplate}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <TemplatePreviewDialog
        template={selectedTemplate}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />
    </div>
  );
}
