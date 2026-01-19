import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Zap, RefreshCw, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAutomacoes, useDeleteAutomacao, useUpdateAutomacao, ApiIntegration } from "@/hooks/useAutomacoes";
import { ApiDetailsDialog } from "@/components/configuracoes/ApiDetailsDialog";
import { EditAutomacaoDialog } from "@/components/configuracoes/EditAutomacaoDialog";
import { DeleteAutomacaoDialog } from "@/components/configuracoes/DeleteAutomacaoDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Automacoes() {
  const { data: integrations, isLoading, refetch, isRefetching } = useAutomacoes();
  const deleteAutomacao = useDeleteAutomacao();
  const updateAutomacao = useUpdateAutomacao();

  const [selectedApi, setSelectedApi] = useState<ApiIntegration | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleViewDetails = (api: ApiIntegration) => {
    setSelectedApi(api);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (api: ApiIntegration) => {
    setSelectedApi(api);
    setEditDialogOpen(true);
  };

  const handleDelete = (api: ApiIntegration) => {
    setSelectedApi(api);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedApi && selectedApi.tabelaOrigem) {
      deleteAutomacao.mutate(
        { id: selectedApi.id, tabelaOrigem: selectedApi.tabelaOrigem },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSelectedApi(null);
          },
        }
      );
    }
  };

  const handleSaveEdit = (data: Record<string, unknown>) => {
    if (selectedApi && selectedApi.tabelaOrigem) {
      updateAutomacao.mutate(
        { tabelaOrigem: selectedApi.tabelaOrigem, data },
        {
          onSuccess: () => {
            setEditDialogOpen(false);
            setSelectedApi(null);
          },
        }
      );
    }
  };

  const getStatusBadge = (status: ApiIntegration["status"]) => {
    switch (status) {
      case "ativo":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ativo
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pendente
          </Badge>
        );
      case "erro":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Inativo
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Automações
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as integrações e APIs conectadas ao sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrações Configuradas</CardTitle>
          <CardDescription>
            Veja o status de cada API e o total de consultas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Integração</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-center w-[100px]">Consultas</TableHead>
                    <TableHead className="w-[150px]">Última Atividade</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations?.map((api) => (
                    <TableRow key={api.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <api.icone className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{api.nome}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {api.descricao}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(api.status)}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{api.totalConsultas}</span>
                      </TableCell>
                      <TableCell>
                        {api.ultimaAtividade ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(api.ultimaAtividade), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(api)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(api)}
                              disabled={!api.podeEditar}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(api)}
                              disabled={!api.podeExcluir}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      <ApiDetailsDialog
        api={selectedApi}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <EditAutomacaoDialog
        api={selectedApi}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        isSaving={updateAutomacao.isPending}
      />

      <DeleteAutomacaoDialog
        api={selectedApi}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteAutomacao.isPending}
      />
    </div>
  );
}
