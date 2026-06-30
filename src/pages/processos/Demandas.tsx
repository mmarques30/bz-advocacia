import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutList, Kanban, BarChart3, CalendarDays } from "lucide-react";
import { useDemandas, useDemandasStats, useDemandasByStatus, useDeleteDemanda } from "@/hooks/useDemandas";
import { DemandasFilters } from "@/components/demandas/DemandasFilters";
import { DemandasTable } from "@/components/demandas/DemandasTable";
import { DemandasKPIs } from "@/components/demandas/DemandasKPIs";
import { DemandasKanban } from "@/components/demandas/DemandasKanban";
import { NewDemandaDialog } from "@/components/demandas/NewDemandaDialog";
import { DemandaDetailsDialog } from "@/components/demandas/DemandaDetailsDialog";
import { ProdutividadeDashboard } from "@/components/demandas/ProdutividadeDashboard";
import { CalendarioView } from "@/components/processos/CalendarioView";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FiltersType>({});
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  // Tabs principais: demandas / calendario / alertas. Aceita ?tab=calendario
  // via querystring pra suportar o redirect da rota antiga /processos/calendario.
  const tabInicial = (searchParams.get("tab") as 'demandas' | 'calendario' | 'alertas') || 'demandas';
  const [activeTab, setActiveTab] = useState<'demandas' | 'calendario' | 'alertas'>(tabInicial);

  useEffect(() => {
    // Limpa o ?tab= da URL apos aplicar pra nao re-aplicar em refresh.
    if (searchParams.get("tab")) {
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // Mantém a demanda aberta no diálogo sincronizada com os dados recém
  // buscados. Sem isso, o objeto guardado em `selectedDemanda` era um
  // snapshot do clique e continuava mostrando o status antigo mesmo
  // depois de salvar a alteração.
  useEffect(() => {
    if (!selectedDemanda) return;
    const candidatos: Demanda[] = [
      ...(demandas || []),
      ...Object.values(demandasByStatus || {}).flat(),
    ];
    const atualizada = candidatos.find((d) => d.id === selectedDemanda.id);
    if (atualizada && atualizada !== selectedDemanda) {
      setSelectedDemanda(atualizada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandas, demandasByStatus]);

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
          <h1 className="text-3xl font-seasons text-primary">Gestão de Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as demandas relacionadas a processos, vendas e operações
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Demanda
        </Button>
      </div>

      {/* Tabs principais: Demandas / Calendário / Produtividade */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'demandas' | 'calendario' | 'alertas')}>
        <TabsList>
          <TabsTrigger value="demandas" className="flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            Demandas
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Produtividade
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
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tab: Calendário (absorveu a antiga pagina de Prazos) */}
        <TabsContent value="calendario" className="mt-6">
          <CalendarioView />
        </TabsContent>

        {/* Tab: Alertas Unificados */}
        <TabsContent value="alertas" className="mt-6">
          <ProdutividadeDashboard />
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
