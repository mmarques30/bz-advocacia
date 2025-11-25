import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DemandasHeader } from "@/components/demandas/DemandasHeader";
import { DemandasFilters } from "@/components/demandas/DemandasFilters";
import { DemandasTable } from "@/components/demandas/DemandasTable";
import { NewDemandaDialog } from "@/components/demandas/NewDemandaDialog";
import { DemandaDetailsDialog } from "@/components/demandas/DemandaDetailsDialog";
import { useDemandas, useDeleteDemanda } from "@/hooks/useDemandas";
import { useCheckIsAdmin } from "@/hooks/useUsuarios";
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

export default function Demandas() {
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    prioridade: '',
    search: '',
  });
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedDemanda, setSelectedDemanda] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: demandas = [], isLoading } = useDemandas(filters);
  const { data: isAdmin } = useCheckIsAdmin();
  const deleteDemanda = useDeleteDemanda();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleView = (demanda: any) => {
    setSelectedDemanda(demanda);
    setIsEditing(false);
    setDetailsOpen(true);
  };

  const handleEdit = (demanda: any) => {
    setSelectedDemanda(demanda);
    setIsEditing(true);
    setDetailsOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteDemanda.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const statusCounts = {
    pendente: demandas.filter(d => d.status === 'pendente').length,
    em_andamento: demandas.filter(d => d.status === 'em_andamento').length,
    concluido: demandas.filter(d => d.status === 'concluido').length,
  };

  return (
    <div className="space-y-6">
      <DemandasHeader onNewDemanda={() => setNewDialogOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusCounts.pendente}</div>
            <p className="text-sm text-muted-foreground">📋 Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusCounts.em_andamento}</div>
            <p className="text-sm text-muted-foreground">🔄 Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusCounts.concluido}</div>
            <p className="text-sm text-muted-foreground">✅ Concluídas</p>
          </CardContent>
        </Card>
      </div>

      <DemandasFilters filters={filters} onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : (
        <DemandasTable
          demandas={demandas}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin || false}
        />
      )}

      <NewDemandaDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />

      <DemandaDetailsDialog
        demanda={selectedDemanda}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isEditing={isEditing}
        isAdmin={isAdmin || false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
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