import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAcordo } from "@/hooks/useFinanceiro";
import { useLeads } from "@/hooks/useLeads";
import { format, addMonths } from "date-fns";
import { FORMA_PAGAMENTO_RECEBIDO_LABELS } from "@/types/financeiro";
import type { FormaPagamento } from "@/types/financeiro";

interface NewAcordoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewAcordoDialog({ open, onClose }: NewAcordoDialogProps) {
  const { data: leads } = useLeads({ search: "", status: [], origem: [], tipoProcesso: [], prioridade: [], responsavel: "", dataInicio: undefined, dataFim: undefined });
  const createAcordo = useCreateAcordo();

  const [clienteId, setClienteId] = useState("");
  const [tipoServico, setTipoServico] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("a_vista");
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState("");
  const [formaPagamentoRecebido, setFormaPagamentoRecebido] = useState("pix");
  const [observacoes, setObservacoes] = useState("");

  const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);

  useEffect(() => {
    if (formaPagamento === "parcelado" && valorTotal && numeroParcelas && dataPrimeiroVencimento) {
      const valor = parseFloat(valorTotal);
      const parcelas = parseInt(numeroParcelas);
      const valorParcela = valor / parcelas;
      const dataInicio = new Date(dataPrimeiroVencimento);

      const preview = Array.from({ length: parcelas }, (_, i) => ({
        numero: i + 1,
        valor: valorParcela,
        data: format(addMonths(dataInicio, i), "yyyy-MM-dd"),
      }));

      setParcelasPreview(preview);
    } else {
      setParcelasPreview([]);
    }
  }, [formaPagamento, valorTotal, numeroParcelas, dataPrimeiroVencimento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parcelas = formaPagamento === "parcelado" 
      ? parcelasPreview.map(p => ({
          numero_parcela: p.numero,
          valor: p.valor,
          data_vencimento: p.data,
          status: "pendente",
        }))
      : [{
          numero_parcela: 1,
          valor: parseFloat(valorTotal),
          data_vencimento: dataPrimeiroVencimento || format(new Date(), "yyyy-MM-dd"),
          status: "pendente",
        }];

    createAcordo.mutate(
      {
        cliente_id: clienteId,
        tipo_servico: tipoServico,
        valor_total: parseFloat(valorTotal),
        forma_pagamento: formaPagamento,
        numero_parcelas: formaPagamento === "parcelado" ? parseInt(numeroParcelas) : 1,
        data_primeiro_vencimento: dataPrimeiroVencimento || null,
        parcelas,
      },
      {
        onSuccess: () => {
          onClose();
          // Reset form
          setClienteId("");
          setTipoServico("");
          setValorTotal("");
          setFormaPagamento("a_vista");
          setNumeroParcelas("1");
          setDataPrimeiroVencimento("");
          setObservacoes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Acordo Financeiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
            <Input
              id="tipo_servico"
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value)}
              required
              placeholder="Ex: Divórcio, Inventário..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_total">Valor Total *</Label>
            <Input
              id="valor_total"
              type="number"
              step="0.01"
              min="0"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <RadioGroup value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a_vista" id="a_vista" />
                <Label htmlFor="a_vista" className="font-normal cursor-pointer">
                  À Vista
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parcelado" id="parcelado" />
                <Label htmlFor="parcelado" className="font-normal cursor-pointer">
                  Parcelado
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formaPagamento === "parcelado" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_parcelas">Número de Parcelas *</Label>
                  <Input
                    id="numero_parcelas"
                    type="number"
                    min="1"
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_primeiro_vencimento">Data 1º Vencimento *</Label>
                  <Input
                    id="data_primeiro_vencimento"
                    type="date"
                    value={dataPrimeiroVencimento}
                    onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma">Forma de Pagamento</Label>
                <Select value={formaPagamentoRecebido} onValueChange={setFormaPagamentoRecebido}>
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

              {parcelasPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview das Parcelas</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Nº</th>
                          <th className="text-left py-2">Vencimento</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelasPreview.map((p) => (
                          <tr key={p.numero} className="border-b">
                            <td className="py-2">{p.numero}</td>
                            <td className="py-2">{format(new Date(p.data), "dd/MM/yyyy")}</td>
                            <td className="text-right py-2">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAcordo.isPending}>
              {createAcordo.isPending ? "Criando..." : "Criar Acordo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
