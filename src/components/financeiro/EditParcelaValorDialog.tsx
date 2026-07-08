import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateParcela } from "@/hooks/useParcelas";
import { toast } from "@/lib/toast";
import { CONTA_LABELS } from "@/types/financeiro";

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
    conta_destino?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function EditParcelaValorDialog({ parcela, open, onClose }: EditParcelaValorDialogProps) {
  const updateParcela = useUpdateParcela();
  const [novoValor, setNovoValor] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [dataPagamento, setDataPagamento] = useState("");
  const [motivo, setMotivo] = useState("");
  // "herdar" = usar a conta do contrato pai. Qualquer outro valor sobrescreve.
  const [contaDestino, setContaDestino] = useState<string>("herdar");

  useEffect(() => {
    if (parcela) {
      setNovoValor(parcela.valor.toString());
      setValorPago(parcela.valor.toString());
      setDataVencimento(parcela.data_vencimento || "");
      setStatus(parcela.status || "pendente");
      setDataPagamento(parcela.data_pagamento || "");
      setMotivo("");
      setContaDestino(parcela.conta_destino ?? "herdar");
    }
  }, [parcela]);

  // Motivo passa a ser obrigatorio se o valor previsto foi alterado OU se o
  // pagamento e parcial (valor_pago != valor previsto). Antes gravava
  // silenciosamente, entao a Ju/Eli conciliavam sem saber por que a parcela
  // diferia do contrato.
  const valorPrevisto = parcela?.valor ?? 0;
  const valorNovoNum = parseFloat(novoValor || "0");
  const valorPagoNum = parseFloat(valorPago || "0");
  const alterouValorPrevisto = !isNaN(valorNovoNum) && valorNovoNum !== valorPrevisto;
  const pagamentoParcial = status === "pago" && !isNaN(valorPagoNum) && Math.abs(valorPagoNum - valorNovoNum) > 0.009;
  const motivoObrigatorio = alterouValorPrevisto || pagamentoParcial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcela) return;

    if (motivoObrigatorio && !motivo.trim()) {
      toast.error("Preencha o motivo — o valor foi alterado ou o pagamento é parcial.");
      return;
    }

    const data: Record<string, any> = {
      valor: valorNovoNum,
      observacoes: motivo || undefined,
      // conta_destino=null significa "herdar do acordo pai" (comportamento
      // padrao). Qualquer chave de CONTA_LABELS sobrescreve.
      conta_destino: contaDestino === "herdar" ? null : contaDestino,
    };

    if (dataVencimento) {
      data.data_vencimento = dataVencimento;
    }

    if (status) {
      data.status = status === "pago" ? "pago" : status;
    }

    if (status === "pago") {
      if (dataPagamento) data.data_pagamento = dataPagamento;
      // valor_pago pode diferir de valor previsto (pagamento parcial ou
      // pagamento a mais). Grava exatamente o que a usuaria digitou.
      if (!isNaN(valorPagoNum)) data.valor_pago = valorPagoNum;
    } else {
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
            <>
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
              <div className="space-y-2">
                <Label htmlFor="valor_pago">Valor recebido *</Label>
                <Input
                  id="valor_pago"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  required
                />
                {pagamentoParcial && (
                  <p className="text-xs text-amber-700">
                    Pagamento parcial: cliente devia {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorNovoNum)} e pagou {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorPagoNum)}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="conta_destino">Conta que recebeu</Label>
                <Select value={contaDestino} onValueChange={setContaDestino}>
                  <SelectTrigger id="conta_destino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="herdar">Herdar do contrato</SelectItem>
                    {Object.entries(CONTA_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Deixe "Herdar" pra usar a conta do contrato. Escolha outra pra registrar que ESTA parcela caiu em conta diferente.
                </p>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da alteração {motivoObrigatorio && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={motivoObrigatorio ? "Ex: Desconto concedido, pagamento parcial acordado..." : "Opcional"}
              required={motivoObrigatorio}
            />
            {motivoObrigatorio && !motivo.trim() && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">
                  Preencha o motivo — o valor previsto foi alterado ou o pagamento é parcial.
                </AlertDescription>
              </Alert>
            )}
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
