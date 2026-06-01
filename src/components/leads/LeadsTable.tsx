import { AlertTriangle, Eye, Edit, MoreVertical, Trash2, CheckSquare, X } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead, LEAD_STATUS_LABELS, ORIGEM_LABELS } from "@/types/leads";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useUpdateLeadStage, useDeleteLead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
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
import { LeadBotBadge } from "./LeadBotBadge";
import { AtenderAgoraButton } from "./AtenderAgoraButton";

interface LeadsTableProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  enableBulkSelect?: boolean;
  onAssumed?: (lead: Lead) => void;
}

export function LeadsTable({ leads, isLoading, onViewDetails, onEdit, enableBulkSelect = false, onAssumed }: LeadsTableProps) {
  const updateStage = useUpdateLeadStage();
  const deleteLead = useDeleteLead();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const queryClient = useQueryClient();


  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!leads) return;
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const handleBulkStatusChange = async (estagio: string) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const ids = [...selectedIds];
      const { error } = await supabase
        .from('contact_submissions')
        .update({ estagio })
        .in('id', ids);
      if (error) throw error;

      const interacoes = ids.map(id => ({
        lead_id: id,
        tipo: 'alteracao_em_lote',
        canal: 'sistema',
        mensagem: `Estágio alterado em lote para: ${LEAD_STATUS_LABELS[estagio] || estagio}`,
        direcao: 'saida',
        eh_bot: false,
      }));
      await supabase.from('lead_interacoes').insert(interacoes);

      toast.success(`${ids.length} lead(s) atualizado(s) com sucesso`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (err) {
      toast.error("Erro ao atualizar leads em lote");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} lead(s) excluído(s) com sucesso`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (err) {
      toast.error("Erro ao excluir leads em lote");
    } finally {
      setBulkDeleting(false);
    }
  };


  const getOrigemBadgeColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-800 border-blue-200",
      facebook: "bg-blue-100 text-blue-800 border-blue-200",
      instagram: "bg-pink-100 text-pink-800 border-pink-200",
      tiktok: "bg-gray-100 text-gray-800 border-gray-200",
      linkedin: "bg-sky-100 text-sky-800 border-sky-200",
      meta: "bg-purple-100 text-purple-800 border-purple-200",
      indicacao: "bg-green-100 text-green-800 border-green-200",
      site: "bg-primary/10 text-primary border-primary/20",
      whatsapp_bot: "bg-emerald-100 text-emerald-800 border-emerald-200",
      outro: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[origem] || colors.outro;
  };

  const getEstagioColor = (estagio: string) => {
    const colors: Record<string, string> = {
      novo: "bg-blue-100 text-blue-800 border-blue-200",
      contato_inicial: "bg-cyan-100 text-cyan-800 border-cyan-200",
      em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
      proposta_enviada: "bg-orange-100 text-orange-800 border-orange-200",
      fechado: "bg-green-100 text-green-800 border-green-200",
      perdido: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[estagio] || "";
  };

  const getDiasParadoColor = (dias: number) => {
    if (dias > 7) return "text-destructive font-semibold";
    if (dias >= 4) return "text-yellow-600 font-medium";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Nenhum lead encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {enableBulkSelect && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <Badge variant="secondary" className="text-sm">
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            {selectedIds.size} lead(s) selecionado(s)
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={bulkUpdating}>
                Alterar status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => handleBulkStatusChange(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkDeleting}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir selecionados
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 mr-1" />
            Cancelar seleção
          </Button>

        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {enableBulkSelect && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={leads.length > 0 && selectedIds.size === leads.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              <TableHead>Nome</TableHead>
              <TableHead>Bot SDR</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estágio</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Dias Parado</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/40",
                  selectedIds.has(lead.id) && "bg-primary/5",
                  lead.status_sdr === "sql_aguardando_humano" && "bg-orange-50 hover:bg-orange-100",
                )}
                onClick={() => onViewDetails(lead)}
              >
                {enableBulkSelect && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {lead.dias_parado && lead.dias_parado > 7 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="truncate max-w-[200px]">
                      {lead.nome_completo}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    <LeadCampanhaBadge lead={lead} />
                    <LeadBotBadge lead={lead} />
                    {lead.status_sdr === "sql_aguardando_humano" && (
                      <AtenderAgoraButton lead={lead} onAssumed={onAssumed} />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={getOrigemBadgeColor(lead.origem)}>
                      {ORIGEM_LABELS[lead.origem] || lead.origem}
                    </Badge>
                    {lead.origem_descricao && (
                      <span className="text-xs text-muted-foreground">{lead.origem_descricao}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize">
                  {lead.tipo_processo === 'Outro' && lead.outro_tipo_processo
                    ? lead.outro_tipo_processo
                    : lead.tipo_processo}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                    {LEAD_STATUS_LABELS[lead.estagio]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.status_cliente ? (
                    <Badge 
                      variant="outline" 
                      className={lead.status_cliente === 'ativo' 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {lead.status_cliente === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(lead.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <span className={cn(getDiasParadoColor(lead.dias_parado || 0))}>
                    {lead.dias_parado || 0} dias
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Abrir ações do lead">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewDetails(lead)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Alterar Estágio</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => updateStage.mutate({ id: lead.id, estagio: key })}
                              disabled={lead.estagio === key}
                            >
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setLeadToDelete(lead)}
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

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome_completo}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  deleteLead.mutate(leadToDelete.id);
                  setLeadToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir leads selecionados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> lead(s)?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              disabled={bulkDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {bulkDeleting ? "Excluindo..." : `Excluir ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
}