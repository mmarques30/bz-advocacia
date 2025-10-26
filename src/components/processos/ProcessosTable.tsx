import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Eye, FileText, Calendar, MoreVertical } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Processo, PROCESSO_STATUS_LABELS } from "@/types/processos";

interface ProcessosTableProps {
  processos: Processo[];
  isLoading: boolean;
  onViewDetails: (processoId: string) => void;
  onAddAndamento: (processoId: string) => void;
}

export function ProcessosTable({
  processos,
  isLoading,
  onViewDetails,
  onAddAndamento,
}: ProcessosTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      em_andamento: "default",
      concluido: "secondary",
      arquivado: "outline",
      suspenso: "destructive",
    };
    return variants[status] || "default";
  };

  const isPrazoProximo = (prazo: string | null) => {
    if (!prazo) return false;
    const diasRestantes = Math.ceil(
      (new Date(prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasRestantes >= 0 && diasRestantes <= 7;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (processos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Nenhum processo encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Processo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tribunal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead>Próximo Prazo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.map((processo) => (
            <TableRow key={processo.id}>
              <TableCell className="font-mono text-sm">
                {processo.numero_processo || "Sem número"}
              </TableCell>

              <TableCell>
                {processo.cliente ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => {
                      // TODO: Navegar para perfil do cliente
                    }}
                  >
                    {processo.cliente.nome_completo}
                  </Button>
                ) : (
                  <span className="text-muted-foreground">Sem cliente</span>
                )}
              </TableCell>

              <TableCell>{processo.tipo}</TableCell>

              <TableCell>
                {processo.tribunal ? (
                  <Badge variant="outline">{processo.tribunal}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell>
                <Badge variant={getStatusBadgeVariant(processo.status)}>
                  {PROCESSO_STATUS_LABELS[processo.status]}
                </Badge>
              </TableCell>

              <TableCell>
                {processo.data_ultima_atualizacao
                  ? format(new Date(processo.data_ultima_atualizacao), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "-"}
              </TableCell>

              <TableCell>
                {processo.prazo_proximo ? (
                  <div className="flex items-center gap-2">
                    {isPrazoProximo(processo.prazo_proximo) && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span
                      className={
                        isPrazoProximo(processo.prazo_proximo) ? "text-orange-600 font-medium" : ""
                      }
                    >
                      {format(new Date(processo.prazo_proximo), "dd/MM/yyyy")}
                    </span>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(processo.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddAndamento(processo.id)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Adicionar Andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Prazos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
