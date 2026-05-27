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
import { useRegistrarPagamento } from "@/hooks/useParcelas";
import { supabase } from "@/integrations/supabase/client";
import { FORMA_PAGAMENTO_RECEBIDO_LABELS } from "@/types/financeiro";
import { format } from "date-fns";

interface RegistrarPagamentoDialogProps {
  parcelaId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RegistrarPagamentoDialog({ parcelaId, open, onClose }: RegistrarPagamentoDialogProps) {
  const registrarPagamento = useRegistrarPagamento();
  const [parcela, setParcela] = useState<any>(null);
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [valorPago, setValorPago] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (parcelaId) {
      fetchParcela();
    }
  }, [parcelaId]);

  const fetchParcela = async () => {
    if (!parcelaId) return;

    const { data } = await supabase
      .from("parcelas_financeiras")
      .select(`
        *,
        acordo:acordos_financeiros!acordo_id(
          cliente:contact_submissions!cliente_id(nome_completo)
        )
      `)
      .eq("id", parcelaId)
      .single();

    if (data) {
      setParcela(data);
      // Pré-preenche com o saldo restante (valor esperado menos o que já
      // foi recebido), pra que o caso comum — receber o que falta — seja
      // um clique. Pagamento parcial é só digitar um valor menor.
      const restante = Number(data.valor ?? 0) - Number(data.valor_pago ?? 0);
      setValorPago((restante > 0 ? restante : 0).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!parcelaId) return;

    registrarPagamento.mutate(
      {
        parcelaId,
        dataPagamento,
        valorPago: parseFloat(valorPago),
        formaPagamento,
        observacoes,
      },
      {
        onSuccess: () => {
          onClose();
          setDataPagamento(format(new Date(), "yyyy-MM-dd"));
          setValorPago("");
          setFormaPagamento("pix");
          setObservacoes("");
        },
      }
    );
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info readonly */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{parcela.acordo?.cliente?.nome_completo}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Parcela</p>
                <p className="font-medium">{parcela.numero_parcela}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Esperado</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já recebido</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(parcela.valor_pago ?? 0))}
                </p>
              </div>
            </div>
            {Number(parcela.valor_pago ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                Saldo em aberto:{" "}
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    Math.max(Number(parcela.valor ?? 0) - Number(parcela.valor_pago ?? 0), 0),
                  )}
                </span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor recebido agora *</Label>
              <Input
                id="valor_pago"
                type="number"
                step="0.01"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Se o cliente pagou menos que o esperado, a parcela continua em aberto com o saldo restante.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGAMENTO_RECEBIDO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre o pagamento..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarPagamento.isPending}>
                {registrarPagamento.isPending ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
