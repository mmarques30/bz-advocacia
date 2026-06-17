import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateAcordo } from "@/hooks/useFinanceiro";
import {
  CONTA_LABELS,
  STATUS_ACORDO_LABELS,
  type AcordoFinanceiro,
} from "@/types/financeiro";

interface EditAcordoDialogProps {
  acordo: AcordoFinanceiro | null;
  open: boolean;
  onClose: () => void;
}

// Edita os campos de header do acordo (tipo, valor, status, conta, obs).
// Parcelas tem fluxo proprio (EditParcelaValorDialog, AddParcelaDialog).
export function EditAcordoDialog({ acordo, open, onClose }: EditAcordoDialogProps) {
  const updateAcordo = useUpdateAcordo();

  const [tipoServico, setTipoServico] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [status, setStatus] = useState<string>("ativo");
  const [conta, setConta] = useState<string>("escritorio");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!acordo) return;
    setTipoServico(acordo.tipo_servico ?? "");
    setValorTotal(acordo.valor_total != null ? String(acordo.valor_total) : "");
    setStatus(acordo.status ?? "ativo");
    setConta((acordo as any).conta ?? "escritorio");
    setObservacoes((acordo as any).observacoes ?? "");
  }, [acordo, open]);

  if (!acordo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAcordo.mutate(
      {
        id: acordo.id,
        tipo_servico: tipoServico.trim() || undefined,
        valor_total: valorTotal ? parseFloat(valorTotal) : undefined,
        status,
        conta,
        observacoes: observacoes.trim() || null,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Contrato Financeiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={acordo.cliente?.nome_completo ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Pra trocar o cliente, exclua o contrato e crie um novo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tipo-servico">Tipo de Serviço</Label>
            <Input
              id="edit-tipo-servico"
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value)}
              placeholder="Ex: Divórcio, Inventário..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-valor-total">Valor Total</Label>
            <Input
              id="edit-valor-total"
              type="number"
              step="0.01"
              min="0"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Editar não recalcula parcelas — ajuste cada parcela na lista abaixo, se necessário.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ACORDO_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-conta">Conta</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger id="edit-conta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTA_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-observacoes">Observações</Label>
            <Textarea
              id="edit-observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAcordo.isPending}>
              {updateAcordo.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
