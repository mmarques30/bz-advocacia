import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Demanda {
  id: string;
  titulo: string;
  tipo: 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  responsavel?: { nome_completo: string };
  created_at: string;
}

interface DemandasTableProps {
  demandas: Demanda[];
  onView: (demanda: Demanda) => void;
  onEdit: (demanda: Demanda) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const tipoConfig = {
  melhoria: { icon: '🔧', label: 'Melhoria', variant: 'default' as const },
  bug: { icon: '🐛', label: 'Bug', variant: 'destructive' as const },
  sugestao: { icon: '💡', label: 'Sugestão', variant: 'secondary' as const },
  tarefa: { icon: '📋', label: 'Tarefa', variant: 'outline' as const },
};

const statusConfig = {
  pendente: { icon: '📋', label: 'Pendente', variant: 'secondary' as const },
  em_andamento: { icon: '🔄', label: 'Em Andamento', variant: 'default' as const },
  concluido: { icon: '✅', label: 'Concluído', variant: 'outline' as const },
  cancelado: { icon: '❌', label: 'Cancelado', variant: 'destructive' as const },
};

const prioridadeConfig = {
  baixa: { variant: 'outline' as const },
  media: { variant: 'secondary' as const },
  alta: { variant: 'default' as const },
  urgente: { variant: 'destructive' as const },
};

export const DemandasTable = ({ demandas, onView, onEdit, onDelete, isAdmin }: DemandasTableProps) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhuma demanda encontrada
              </TableCell>
            </TableRow>
          ) : (
            demandas.map((demanda) => (
              <TableRow key={demanda.id}>
                <TableCell className="font-medium">{demanda.titulo}</TableCell>
                <TableCell>
                  <Badge variant={tipoConfig[demanda.tipo].variant}>
                    {tipoConfig[demanda.tipo].icon} {tipoConfig[demanda.tipo].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[demanda.status].variant}>
                    {statusConfig[demanda.status].icon} {statusConfig[demanda.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={prioridadeConfig[demanda.prioridade].variant}>
                    {demanda.prioridade.charAt(0).toUpperCase() + demanda.prioridade.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {demanda.responsavel?.nome_completo || '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(demanda.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(demanda)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(demanda)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(demanda.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};