import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDespesa, useUpdateDespesa } from "@/hooks/useDespesas";
import { useProcessos } from "@/hooks/useProcessos";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { FORMA_PAGAMENTO_RECEBIDO_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";
import type { CategoriaDespesa, StatusDespesa, FormaPagamentoRecebido } from "@/types/financeiro";
import { Skeleton } from "@/components/ui/skeleton";

interface DespesaDetailsDialogProps {
  despesaId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DespesaDetailsDialog({ despesaId, open, onClose }: DespesaDetailsDialogProps) {
  const { data: despesa, isLoading } = useDespesa(despesaId);
  const updateDespesa = useUpdateDespesa();
  const { data: processos } = useProcessos({ status: undefined });
  const { options: categoriaOptions, getLabel: getCategoriaLabel } = useCategoriasDespesa();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date | undefined>(undefined);
  const [categoria, setCategoria] = useState<CategoriaDespesa | "">("");
  const [processoId, setProcessoId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRecebido | "">("");
  const [status, setStatus] = useState<StatusDespesa>("pendente");
  const [observacoes, setObservacoes] = useState("");
  // Confirmation state: quando o usuario tenta transicionar para 'pago',
  // abrimos um AlertDialog com resumo (descricao, valor, data) para que
  // ele valide antes de efetivamente salvar.
  const [confirmPagoOpen, setConfirmPagoOpen] = useState(false);

  useEffect(() => {
    if (despesa) {
      setDescricao(despesa.descricao);
      setValor(despesa.valor.toString());
      setData(new Date(despesa.data));
      setCategoria(despesa.categoria);
      setProcessoId(despesa.processo_id || "");
      setFormaPagamento(despesa.forma_pagamento || "");
      setStatus(despesa.status);
      setObservacoes(despesa.observacoes || "");
    }
  }, [despesa]);

  const persist = () => {
    if (!despesaId || !descricao || !valor || !data || !categoria) return;
    updateDespesa.mutate(
      {
        id: despesaId,
        descricao,
        valor: parseFloat(valor),
        data: format(data, "yyyy-MM-dd"),
        categoria,
        processo_id: processoId || null,
        forma_pagamento: formaPagamento || null,
        status,
        observacoes: observacoes || null,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!despesaId || !descricao || !valor || !data || !categoria) {
      return;
    }

    // Fluxo de validacao: se o usuario esta transicionando de
    // pendente/atrasado -> pago, pedimos confirmacao explicita para
    // evitar marcar como pago por engano.
    const estavaPago = despesa?.status === "pago";
    if (status === "pago" && !estavaPago) {
      setConfirmPagoOpen(true);
      return;
    }

    persist();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!despesa) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <SearchableCombobox
                value={categoria}
                onChange={(value) => setCategoria(value as CategoriaDespesa)}
                options={categoriaOptions}
                placeholder="Selecione"
                searchPlaceholder="Buscar categoria..."
                emptyText="Nenhuma categoria encontrada."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processo">Processo (opcional)</Label>
              <Select value={processoId || "none"} onValueChange={(val) => setProcessoId(val === "none" ? "" : val)}>
                <SelectTrigger id="processo">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {processos?.map((processo) => (
                    <SelectItem key={processo.id} value={processo.id}>
                      {processo.numero_processo || processo.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select value={formaPagamento || "none"} onValueChange={(value) => setFormaPagamento(value === "none" ? "" : value as FormaPagamentoRecebido)}>
                <SelectTrigger id="forma_pagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {Object.entries(FORMA_PAGAMENTO_RECEBIDO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status de Pagamento</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusDespesa)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_DESPESA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateDespesa.isPending}>
              {updateDespesa.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>

        <AlertDialog open={confirmPagoOpen} onOpenChange={setConfirmPagoOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-1">
                  <p>Você está marcando esta despesa como paga. Confira os dados:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>
                      <strong>Descrição:</strong> {descricao || "-"}
                    </li>
                    <li>
                      <strong>Valor:</strong>{" "}
                      {valor
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(parseFloat(valor))
                        : "-"}
                    </li>
                    <li>
                      <strong>Data:</strong>{" "}
                      {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </li>
                    <li>
                      <strong>Categoria:</strong>{" "}
                      {categoria ? getCategoriaLabel(categoria) : "-"}
                    </li>
                  </ul>
                  <p className="pt-2 text-sm text-muted-foreground">
                    Esta ação pode ser revertida editando novamente a despesa.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Revisar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmPagoOpen(false);
                  persist();
                }}
              >
                Confirmar pagamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
