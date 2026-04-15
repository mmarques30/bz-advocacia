import { Eye, Edit, MoreVertical, Trash2, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Cake } from "lucide-react";
import { useState, useMemo } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead, ORIGEM_LABELS } from "@/types/leads";
import { format } from "date-fns";
import { useDeleteLead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface ClientesTableProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function ClientesTable({ leads, isLoading, onViewDetails, onEdit }: ClientesTableProps) {
  const deleteLead = useDeleteLead();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Add Brazil country code if not present
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    return `55${cleaned}`;
  };

  const openWhatsApp = (phone: string, name: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    if (!sortDirection) return leads;
    
    return [...leads].sort((a, b) => {
      const nameA = a.nome_completo.toLowerCase();
      const nameB = b.nome_completo.toLowerCase();
      
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB, 'pt-BR');
      } else {
        return nameB.localeCompare(nameA, 'pt-BR');
      }
    });
  }, [leads, sortDirection]);

  const toggleSort = () => {
    if (sortDirection === null) setSortDirection('asc');
    else if (sortDirection === 'asc') setSortDirection('desc');
    else setSortDirection('asc');
  };

  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;

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
        <p className="text-muted-foreground">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSort}
                className="h-8 px-2 -ml-2 hover:bg-muted"
              >
                Nome
                <SortIcon className="ml-1 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[60px] text-center">WhatsApp</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Data Cadastro</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                  {lead.nome_completo}
                  {lead.data_nascimento && (() => {
                    const today = new Date();
                    const [y, m, d] = lead.data_nascimento!.split('-').map(Number);
                    return m === today.getMonth() + 1 && d === today.getDate();
                  })() && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Cake className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>Aniversariante hoje!</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {(!lead.telefone || lead.telefone.trim() === '') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>WhatsApp não cadastrado</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {lead.telefone && lead.telefone.trim() !== '' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => openWhatsApp(lead.telefone, lead.nome_completo)}
                    title={`Enviar WhatsApp para ${lead.telefone}`}
                    aria-label={`Enviar WhatsApp para ${lead.nome_completo}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-40 cursor-not-allowed"
                          disabled
                          aria-label="WhatsApp indisponível — telefone não cadastrado"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>WhatsApp não cadastrado — edite o cliente para adicionar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
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
                {lead.data_ultima_atividade 
                  ? format(new Date(lead.data_ultima_atividade), "dd/MM/yyyy")
                  : "-"
                }
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Abrir ações de ${lead.nome_completo}`}>
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

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{leadToDelete?.nome_completo}</strong>?
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
