import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAcordo } from "@/hooks/useFinanceiro";
import { useLeads } from "@/hooks/useLeads";
import { useClienteContratos } from "@/hooks/useClienteContratos";
import { format, addMonths } from "date-fns";
import { FORMA_PAGAMENTO_RECEBIDO_LABELS } from "@/types/financeiro";
import type { FormaPagamento } from "@/types/financeiro";
import { CONTA_LABELS } from "@/types/financeiro";

interface NewAcordoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewAcordoDialog({ open, onClose }: NewAcordoDialogProps) {
  const { data: leads } = useLeads({ search: "", status: [], origem: [], tipoProcesso: [], dateRange: { start: null, end: null }, diasParado: { min: 0, max: null }, responsavel: null, statusCliente: [] });
  const createAcordo = useCreateAcordo();

  const [clienteId, setClienteId] = useState("");
  const { data: contratos } = useClienteContratos(clienteId);
  const [prefilledFromContrato, setPrefilledFromContrato] = useState(false);
  const [tipoServico, setTipoServico] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("a_vista");
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState("");
  const [formaPagamentoRecebido, setFormaPagamentoRecebido] = useState("pix");
  const [observacoes, setObservacoes] = useState("");
  const [conta, setConta] = useState("escritorio");
  const [comEntrada, setComEntrada] = useState(false);
  const [valorEntrada, setValorEntrada] = useState("");

  // Pre-fill from generated contract when client is selected
  useEffect(() => {
    if (clienteId && contratos && contratos.length > 0) {
      const contrato = contratos[0]; // most recent
      const valores = contrato.valores;

      setTipoServico(contrato.tipo_contrato || "");

      if (valores?.valor_total) {
        setValorTotal(valores.valor_total.toString());
      }

      if (valores?.valor_entrada && valores.valor_entrada > 0) {
        setComEntrada(true);
        setValorEntrada(valores.valor_entrada.toString());
      }

      if (valores?.num_parcelas && valores.num_parcelas > 1) {
        setFormaPagamento("parcelado");
        setNumeroParcelas(valores.num_parcelas.toString());
      }

      setPrefilledFromContrato(true);
    } else if (!clienteId) {
      setPrefilledFromContrato(false);
    }
  }, [clienteId, contratos]);



  const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);

  useEffect(() => {
    if (formaPagamento === "parcelado" && valorTotal && numeroParcelas && dataPrimeiroVencimento) {
      const valor = parseFloat(valorTotal);
      const parcelas = parseInt(numeroParcelas);
      const dataInicio = new Date(dataPrimeiroVencimento);

      if (comEntrada && valorEntrada) {
        const entrada = parseFloat(valorEntrada);
        const restante = valor - entrada;
        const valorParcela = parcelas > 0 ? restante / parcelas : 0;

        const preview = [
          { numero: 1, valor: entrada, data: format(new Date(), "yyyy-MM-dd"), isEntrada: true },
          ...Array.from({ length: parcelas }, (_, i) => ({
            numero: i + 2,
            valor: valorParcela,
            data: format(addMonths(dataInicio, i), "yyyy-MM-dd"),
            isEntrada: false,
          })),
        ];
        setParcelasPreview(preview);
      } else {
        const valorParcela = valor / parcelas;
        const preview = Array.from({ length: parcelas }, (_, i) => ({
          numero: i + 1,
          valor: valorParcela,
          data: format(addMonths(dataInicio, i), "yyyy-MM-dd"),
          isEntrada: false,
        }));
        setParcelasPreview(preview);
      }
    } else {
      setParcelasPreview([]);
    }
  }, [formaPagamento, valorTotal, numeroParcelas, dataPrimeiroVencimento, comEntrada, valorEntrada]);

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

    const totalParcelas = comEntrada ? parseInt(numeroParcelas) + 1 : (formaPagamento === "parcelado" ? parseInt(numeroParcelas) : 1);

    createAcordo.mutate(
      {
        cliente_id: clienteId,
        tipo_servico: tipoServico,
        valor_total: parseFloat(valorTotal),
        forma_pagamento: formaPagamento,
        numero_parcelas: totalParcelas,
        data_primeiro_vencimento: dataPrimeiroVencimento || null,
        conta,
        parcelas,
      },
      {
        onSuccess: () => {
          onClose();
          setClienteId("");
          setTipoServico("");
          setValorTotal("");
          setFormaPagamento("a_vista");
          setNumeroParcelas("1");
          setDataPrimeiroVencimento("");
          setObservacoes("");
          setComEntrada(false);
          setValorEntrada("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato Financeiro</DialogTitle>
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

          {prefilledFromContrato && (
            <Alert className="border-primary/30 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Valores pré-preenchidos a partir do contrato gerado — você pode editá-los.
              </AlertDescription>
            </Alert>
          )}

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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="com_entrada"
                  checked={comEntrada}
                  onCheckedChange={(checked) => {
                    setComEntrada(checked === true);
                    if (!checked) setValorEntrada("");
                  }}
                />
                <Label htmlFor="com_entrada" className="font-normal cursor-pointer">
                  Com entrada?
                </Label>
              </div>

              {comEntrada && (
                <div className="space-y-2">
                  <Label htmlFor="valor_entrada">Valor da Entrada *</Label>
                  <Input
                    id="valor_entrada"
                    type="number"
                    step="0.01"
                    min="0"
                    max={valorTotal || undefined}
                    value={valorEntrada}
                    onChange={(e) => setValorEntrada(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                  {valorTotal && valorEntrada && (
                    <p className="text-xs text-muted-foreground">
                      Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTotal) - parseFloat(valorEntrada))} em {numeroParcelas}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((parseFloat(valorTotal) - parseFloat(valorEntrada)) / (parseInt(numeroParcelas) || 1))}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_parcelas">Número de Parcelas {comEntrada ? "(sem contar entrada)" : ""} *</Label>
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
                  <Label htmlFor="data_primeiro_vencimento">{comEntrada ? "Data 1ª Parcela *" : "Data 1º Vencimento *"}</Label>
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
                          <th className="text-left py-2">Tipo</th>
                          <th className="text-left py-2">Vencimento</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelasPreview.map((p) => (
                          <tr key={p.numero} className="border-b">
                            <td className="py-2">{p.numero}</td>
                            <td className="py-2">
                              {p.isEntrada ? (
                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">Entrada</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Parcela</span>
                              )}
                            </td>
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
            <Label htmlFor="conta">Conta *</Label>
            <Select value={conta} onValueChange={setConta}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTA_LABELS).map(([key, label]) => (
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
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAcordo.isPending}>
              {createAcordo.isPending ? "Criando..." : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
