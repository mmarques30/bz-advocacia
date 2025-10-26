import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { TagCard } from "@/components/tags/TagCard";
import { NewTagDialog } from "@/components/tags/NewTagDialog";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, Tag } from "@/hooks/useTags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Tags() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const { data: tags, isLoading } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const filteredTags = tags?.filter((tag) => {
    const matchesSearch = tag.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || tag.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const groupedTags = filteredTags?.reduce(
    (acc, tag) => {
      if (!acc[tag.tipo]) {
        acc[tag.tipo] = [];
      }
      acc[tag.tipo].push(tag);
      return acc;
    },
    {} as Record<string, Tag[]>
  );

  const handleSubmit = (data: Partial<Tag>) => {
    if (editingTag) {
      updateMutation.mutate(data as any);
    } else {
      createMutation.mutate(data);
    }
    setEditingTag(null);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTagToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      deleteMutation.mutate(tagToDelete);
      setTagToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const tipoLabels: Record<string, string> = {
    lead: "TAGS DE LEADS",
    processo: "TAGS DE PROCESSOS",
    geral: "TAGS GERAIS",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">
            Organize leads e processos com tags personalizadas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTag(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="processo">Processos</SelectItem>
            <SelectItem value="geral">Gerais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !filteredTags || filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma tag encontrada</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTags || {}).map(([tipo, tagsList]) => (
            <div key={tipo} className="space-y-4">
              <h2 className="text-xl font-semibold">
                {tipoLabels[tipo]} ({tagsList.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tagsList.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewTagDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleSubmit}
        editingTag={editingTag}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tag? Esta ação não pode ser desfeita e
              removerá a tag de todos os itens associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
