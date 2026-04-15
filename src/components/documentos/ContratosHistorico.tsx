import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useContratos, useDeleteContrato } from "@/hooks/useContratos";
import { STATUS_CONTRATO, TIPOS_CONTRATO } from "@/types/contratos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, FileDown, Trash2, Eye } from "lucide-react";
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

export function ContratosHistorico() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [tipo, setTipo] = useState<string>("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: contratos, isLoading } = useContratos({
    busca: busca || undefined,
    status: status !== "todos" ? status : undefined,
    tipo_contrato: tipo !== "todos" ? tipo : undefined,
  });

  const deleteContrato = useDeleteContrato();

  const getStatusBadge = (statusValue: string) => {
    const statusConfig = STATUS_CONTRATO.find(s => s.value === statusValue);
    return (
      <Badge className={statusConfig?.color || 'bg-muted'}>
        {statusConfig?.label || statusValue}
      </Badge>
    );
  };

  const getTipoLabel = (tipoValue: string) => {
    return TIPOS_CONTRATO.find(t => t.value === tipoValue)?.label || tipoValue;
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContrato.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico de Contratos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por titulo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS_CONTRATO.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {TIPOS_CONTRATO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : contratos?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                contratos?.map((contrato) => {
                  const numeroProposta = contrato.tipo_contrato === 'proposta' 
                    ? (contrato as unknown as { numero_proposta?: number }).numero_proposta 
                    : null;
                  const numeroContrato = contrato.tipo_contrato !== 'proposta'
                    ? (contrato as unknown as { numero_contrato?: number }).numero_contrato
                    : null;
                  return (
                    <TableRow key={contrato.id}>
                      <TableCell className="text-muted-foreground font-mono">
                        {numeroProposta ? `#P${numeroProposta}` : numeroContrato ? `#C${numeroContrato}` : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{contrato.titulo}</TableCell>
                      <TableCell>{contrato.cliente?.nome_completo || '-'}</TableCell>
                      <TableCell>{getTipoLabel(contrato.tipo_contrato)}</TableCell>
                      <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                      <TableCell>
                        {format(new Date(contrato.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Visualizar" aria-label="Visualizar contrato">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {contrato.pdf_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Baixar PDF"
                              aria-label="Baixar PDF do contrato"
                              asChild
                            >
                              <a href={contrato.pdf_url} target="_blank" rel="noopener noreferrer">
                                <FileDown className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            aria-label="Excluir contrato"
                            onClick={() => setDeleteId(contrato.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog de confirmação */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O contrato sera permanentemente excluido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
