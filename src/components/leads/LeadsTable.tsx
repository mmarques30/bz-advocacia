import { AlertTriangle, Eye, Edit, MoreVertical, Trash2 } from "lucide-react";
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
import { Lead, LEAD_STATUS_LABELS } from "@/types/leads";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useUpdateLeadStage, useDeleteLead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
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

interface LeadsTableProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}

export function LeadsTable({ leads, isLoading, onViewDetails, onEdit }: LeadsTableProps) {
  const updateStage = useUpdateLeadStage();
  const deleteLead = useDeleteLead();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const getOrigemBadgeColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-800 border-blue-200",
      meta: "bg-purple-100 text-purple-800 border-purple-200",
      indicacao: "bg-green-100 text-green-800 border-green-200",
      site: "bg-primary/10 text-primary border-primary/20",
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
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
            <TableRow key={lead.id}>
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
                <Badge variant="outline" className={getOrigemBadgeColor(lead.origem)}>
                  {lead.origem.charAt(0).toUpperCase() + lead.origem.slice(1)}
                </Badge>
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
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

      {/* Dialog de Confirmação de Exclusão */}
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
    </div>
  );
}
