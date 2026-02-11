import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateParcela } from "@/hooks/useParcelas";

interface EditParcelaValorDialogProps {
  parcela: { id: string; valor: number; numero_parcela: number } | null;
  open: boolean;
  onClose: () => void;
}

export function EditParcelaValorDialog({ parcela, open, onClose }: EditParcelaValorDialogProps) {
  const updateParcela = useUpdateParcela();
  const [novoValor, setNovoValor] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (parcela) {
      setNovoValor(parcela.valor.toString());
      setMotivo("");
    }
  }, [parcela]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcela) return;

    updateParcela.mutate(
      {
        parcelaId: parcela.id,
        data: {
          valor: parseFloat(novoValor),
          observacoes: motivo || undefined,
        },
      },
      { onSuccess: onClose }
    );
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Valor - Parcela {parcela.numero_parcela}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Atual</Label>
            <p className="text-sm font-medium text-muted-foreground">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parcela.valor)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="novo_valor">Novo Valor *</Label>
            <Input
              id="novo_valor"
              type="number"
              step="0.01"
              min="0"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da alteração</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Desconto concedido..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={updateParcela.isPending}>
              {updateParcela.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
