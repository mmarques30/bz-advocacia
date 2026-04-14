import { useState, useEffect } from "react";
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
import { useUpdateParcela } from "@/hooks/useParcelas";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Recebido" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
];

interface EditParcelaValorDialogProps {
  parcela: {
    id: string;
    valor: number;
    numero_parcela: number;
    data_vencimento?: string;
    status?: string;
    data_pagamento?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function EditParcelaValorDialog({ parcela, open, onClose }: EditParcelaValorDialogProps) {
  const updateParcela = useUpdateParcela();
  const [novoValor, setNovoValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [dataPagamento, setDataPagamento] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (parcela) {
      setNovoValor(parcela.valor.toString());
      setDataVencimento(parcela.data_vencimento || "");
      setStatus(parcela.status || "pendente");
      setDataPagamento(parcela.data_pagamento || "");
      setMotivo("");
    }
  }, [parcela]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcela) return;

    const data: Record<string, any> = {
      valor: parseFloat(novoValor),
      observacoes: motivo || undefined,
    };

    if (dataVencimento) {
      data.data_vencimento = dataVencimento;
    }

    if (status) {
      data.status = status === "pago" ? "pago" : status;
    }

    if (status === "pago" && dataPagamento) {
      data.data_pagamento = dataPagamento;
    }

    if (status !== "pago") {
      data.data_pagamento = null;
      data.valor_pago = null;
    }

    updateParcela.mutate(
      { parcelaId: parcela.id, data },
      { onSuccess: onClose }
    );
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Parcela {parcela.numero_parcela}</DialogTitle>
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
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Input
              id="data_vencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "pago" && (
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data de Recebimento *</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
              />
            </div>
          )}
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
