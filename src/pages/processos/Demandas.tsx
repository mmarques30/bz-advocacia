import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutList, Kanban, AlertTriangle, Clock } from "lucide-react";
import { useDemandas, useDemandasStats, useDemandasByStatus, useDeleteDemanda } from "@/hooks/useDemandas";
import { DemandasFilters } from "@/components/demandas/DemandasFilters";
import { DemandasTable } from "@/components/demandas/DemandasTable";
import { DemandasKPIs } from "@/components/demandas/DemandasKPIs";
import { DemandasKanban } from "@/components/demandas/DemandasKanban";
import { NewDemandaDialog } from "@/components/demandas/NewDemandaDialog";
import { DemandaDetailsDialog } from "@/components/demandas/DemandaDetailsDialog";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { useAlerts, useRecentActivities } from "@/hooks/useDashboardData";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Demanda, DemandasFilters as FiltersType } from "@/types/demandas";
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

export default function ProcessosDemandas() {
  const [filters, setFilters] = useState<FiltersType>({});
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [activeTab, setActiveTab] = useState<'demandas' | 'alertas' | 'atividades'>('demandas');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandaToDelete, setDemandaToDelete] = useState<string | null>(null);

  const { data: demandas, isLoading: demandasLoading } = useDemandas(filters);
  const { data: stats, isLoading: statsLoading } = useDemandasStats();
  const { data: demandasByStatus, isLoading: kanbanLoading } = useDemandasByStatus();
  const deleteDemanda = useDeleteDemanda();
  
  // Dados para alertas e atividades
  const { filters: dateFilters } = useDateFilter();
  const { data: alerts, isLoading: alertsLoading } = useAlerts(dateFilters);
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(20);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleView = (demanda: Demanda) => {
    setSelectedDemanda(demanda);
    setIsEditing(false);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (demanda: Demanda) => {
    setSelectedDemanda(demanda);
    setIsEditing(true);
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDemandaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (demandaToDelete) {
      deleteDemanda.mutate(demandaToDelete);
      setDeleteDialogOpen(false);
      setDemandaToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Demandas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as demandas relacionadas a processos, vendas e operações
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Demanda
        </Button>
      </div>

      {/* Tabs principais: Demandas, Alertas, Atividades */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'demandas' | 'alertas' | 'atividades')}>
        <TabsList>
          <TabsTrigger value="demandas" className="flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            Demandas
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas Importantes
          </TabsTrigger>
          <TabsTrigger value="atividades" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Atividades Recentes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Demandas */}
        <TabsContent value="demandas" className="mt-6 space-y-6">
          {/* KPIs */}
          <DemandasKPIs stats={stats} loading={statsLoading} />

          {/* Sub-tabs para visualização: Tabela/Kanban */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4 space-y-4">
              <DemandasFilters filters={filters} onFilterChange={handleFilterChange} />
              <DemandasTable
                demandas={demandas || []}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isAdmin={true}
              />
            </TabsContent>

            <TabsContent value="kanban" className="mt-4">
              <DemandasKanban
                demandas={demandasByStatus}
                loading={kanbanLoading}
                onSelectDemanda={handleView}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tab: Alertas Importantes */}
        <TabsContent value="alertas" className="mt-6">
          <AlertsWidget data={alerts || []} loading={alertsLoading} />
        </TabsContent>

        {/* Tab: Atividades Recentes */}
        <TabsContent value="atividades" className="mt-6">
          <RecentActivities data={activities || []} loading={activitiesLoading} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewDemandaDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
      
      <DemandaDetailsDialog
        demanda={selectedDemanda}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        isEditing={isEditing}
        isAdmin={true}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
