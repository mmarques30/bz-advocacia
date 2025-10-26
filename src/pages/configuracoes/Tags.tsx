import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tag as TagIcon, TrendingUp, Calendar } from "lucide-react";
import { useTags, useDeleteTag, useTagStats } from "@/hooks/useTags";
import TagCard from "@/components/tags/TagCard";
import TagFilters from "@/components/tags/TagFilters";
import NewTagDialog from "@/components/tags/NewTagDialog";
import EditTagDialog from "@/components/tags/EditTagDialog";
import type { TagFilters as Filters, TagWithStats } from "@/types/tags";

export default function Tags() {
  const [filters, setFilters] = useState<Filters>({
    busca: '',
    tipo: null,
    ordenacao: 'recente',
  });
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagWithStats | null>(null);

  const { data: tags, isLoading } = useTags(filters);
  const { data: stats, isLoading: statsLoading } = useTagStats();
  const deleteTag = useDeleteTag();

  const handleEdit = (tag: TagWithStats) => {
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTag.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-2">
            Organize leads e processos com tags personalizadas
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalTags}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Usada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.tagMaisUsada.nome}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tagMaisUsada.count} usos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Criadas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.criadasHoje}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <TagFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Grid de Tags */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Nenhuma tag encontrada</CardTitle>
            <CardDescription className="text-center mb-4">
              {filters.busca || filters.tipo
                ? 'Tente ajustar os filtros para encontrar tags.'
                : 'Comece criando sua primeira tag para organizar seus dados.'}
            </CardDescription>
            {!filters.busca && !filters.tipo && (
              <Button onClick={() => setNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tag
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <NewTagDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
      <EditTagDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tag={selectedTag}
      />
    </div>
  );
}
