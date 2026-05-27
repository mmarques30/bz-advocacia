import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddParcela } from "@/hooks/useParcelas";

interface AddParcelaDialogProps {
  acordoId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AddParcelaDialog({ acordoId, open, onClose }: AddParcelaDialogProps) {
  const addParcela = useAddParcela();
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (open) {
      setValor("");
      setDataVencimento("");
      setObservacoes("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acordoId) return;

    addParcela.mutate(
      {
        acordoId,
        valor: parseFloat(valor),
        dataVencimento,
        observacoes: observacoes || undefined,
      },
      { onSuccess: onClose }
    );
  };

  if (!acordoId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Parcela</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parcela_valor">Valor *</Label>
            <Input
              id="parcela_valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcela_vencimento">Data de Vencimento *</Label>
            <Input
              id="parcela_vencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcela_obs">Observações</Label>
            <Textarea
              id="parcela_obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: parcela extra de renegociação..."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A parcela será incluída como pendente e somada ao valor total do contrato.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={addParcela.isPending}>
              {addParcela.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
