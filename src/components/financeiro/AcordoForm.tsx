import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useCreateAcordo } from "@/hooks/useFinanceiro";
import { useLeads } from "@/hooks/useLeads";
import { useClienteContratos } from "@/hooks/useClienteContratos";
import { format, addMonths } from "date-fns";
import { FORMA_PAGAMENTO_RECEBIDO_LABELS } from "@/types/financeiro";
import type { FormaPagamento } from "@/types/financeiro";
import { CONTA_LABELS } from "@/types/financeiro";

interface ParcelaPreview {
  numero: number;
  valor: number;
  data: string;
  isEntrada: boolean;
}

interface AcordoFormProps {
  onClose: () => void;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function AcordoForm({ onClose }: AcordoFormProps) {
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
  const [comExito, setComExito] = useState(false);
  const [exitoPercentual, setExitoPercentual] = useState("");
  const [exitoBase, setExitoBase] = useState("");
  const [exitoDataPrevista, setExitoDataPrevista] = useState("");

  const [parcelasPreview, setParcelasPreview] = useState<ParcelaPreview[]>([]);
  // Quando o usuário ajusta manualmente uma parcela (valor/vencimento) na
  // pré-visualização, paramos de regenerar automaticamente para não apagar
  // a edição. Mudar valor total / nº de parcelas / datas volta a gerar.
  const [parcelasManuais, setParcelasManuais] = useState(false);

  const resetForm = () => {
    setClienteId("");
    setTipoServico("");
    setValorTotal("");
    setFormaPagamento("a_vista");
    setNumeroParcelas("1");
    setDataPrimeiroVencimento("");
    setFormaPagamentoRecebido("pix");
    setObservacoes("");
    setConta("escritorio");
    setComEntrada(false);
    setValorEntrada("");
    setComExito(false);
    setExitoPercentual("");
    setExitoBase("");
    setExitoDataPrevista("");
    setPrefilledFromContrato(false);
    setParcelasManuais(false);
    setParcelasPreview([]);
  };

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

  useEffect(() => {
    // Não sobrescreve edições manuais do usuário na pré-visualização.
    if (parcelasManuais) return;

    if (formaPagamento === "parcelado" && valorTotal && numeroParcelas && dataPrimeiroVencimento) {
      const valor = parseFloat(valorTotal);
      const parcelas = parseInt(numeroParcelas);
      const dataInicio = new Date(dataPrimeiroVencimento);

      if (comEntrada && valorEntrada) {
        const entrada = parseFloat(valorEntrada);
        const restante = valor - entrada;
        const valorParcela = parcelas > 0 ? Math.round((restante / parcelas) * 100) / 100 : 0;
        const somaParcelasRegulares = valorParcela * (parcelas - 1);
        const ultimaParcelaValor = parcelas > 0 ? Math.round((restante - somaParcelasRegulares) * 100) / 100 : 0;

        const preview: ParcelaPreview[] = [
          { numero: 1, valor: entrada, data: format(new Date(), "yyyy-MM-dd"), isEntrada: true },
          ...Array.from({ length: parcelas }, (_, i) => ({
            numero: i + 2,
            valor: i === parcelas - 1 ? ultimaParcelaValor : valorParcela,
            data: format(addMonths(dataInicio, i), "yyyy-MM-dd"),
            isEntrada: false,
          })),
        ];
        setParcelasPreview(preview);
      } else {
        const valorParcela = Math.round((valor / parcelas) * 100) / 100;
        const somaParcelasRegulares = valorParcela * (parcelas - 1);
        const ultimaParcelaValor = Math.round((valor - somaParcelasRegulares) * 100) / 100;

        const preview: ParcelaPreview[] = Array.from({ length: parcelas }, (_, i) => ({
          numero: i + 1,
          valor: i === parcelas - 1 ? ultimaParcelaValor : valorParcela,
          data: format(addMonths(dataInicio, i), "yyyy-MM-dd"),
          isEntrada: false,
        }));
        setParcelasPreview(preview);
      }
    } else {
      setParcelasPreview([]);
    }
  }, [formaPagamento, valorTotal, numeroParcelas, dataPrimeiroVencimento, comEntrada, valorEntrada, parcelasManuais]);

  // Ao mexer nos campos que definem a estrutura das parcelas, retomamos a
  // geração automática (descartando edições manuais anteriores).
  const handleEstruturaChange = (fn: () => void) => {
    setParcelasManuais(false);
    fn();
  };

  const updateParcelaPreview = (index: number, patch: Partial<ParcelaPreview>) => {
    setParcelasManuais(true);
    setParcelasPreview((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  };

  const somaParcelas = parcelasPreview.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const totalNum = parseFloat(valorTotal || "0");
  const divergenciaParcelas =
    formaPagamento === "parcelado" &&
    parcelasPreview.length > 0 &&
    Math.abs(somaParcelas - totalNum) > 0.01;

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
        observacoes: observacoes || null,
        conta,
        parcelas,
        ...(comExito && exitoPercentual && exitoBase
          ? {
              exito_percentual: parseFloat(exitoPercentual),
              exito_base: parseFloat(exitoBase),
              exito_data_prevista: exitoDataPrevista || null,
            }
          : {}),
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao criar contrato financeiro");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cliente">Cliente *</Label>
        <SearchableCombobox
          value={clienteId}
          onChange={setClienteId}
          options={(leads ?? []).map((lead) => ({
            value: lead.id,
            label: lead.nome_completo,
          }))}
          placeholder="Selecione o cliente"
          searchPlaceholder="Digite o nome do cliente..."
          emptyText="Nenhum cliente encontrado."
        />
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
          onChange={(e) => handleEstruturaChange(() => setValorTotal(e.target.value))}
          required
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label>Forma de Pagamento *</Label>
        <RadioGroup
          value={formaPagamento}
          onValueChange={(v) => handleEstruturaChange(() => setFormaPagamento(v as FormaPagamento))}
        >
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
              onCheckedChange={(checked) =>
                handleEstruturaChange(() => {
                  setComEntrada(checked === true);
                  if (!checked) setValorEntrada("");
                })
              }
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
                onChange={(e) => handleEstruturaChange(() => setValorEntrada(e.target.value))}
                required
                placeholder="0.00"
              />
              {valorTotal && valorEntrada && (
                <p className="text-xs text-muted-foreground">
                  Restante: {fmtBRL(parseFloat(valorTotal) - parseFloat(valorEntrada))} em {numeroParcelas}x de {fmtBRL((parseFloat(valorTotal) - parseFloat(valorEntrada)) / (parseInt(numeroParcelas) || 1))}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_parcelas">Número de Parcelas {comEntrada ? "(sem contar entrada)" : ""} *</Label>
              <Input
                id="numero_parcelas"
                type="number"
                min="1"
                value={numeroParcelas}
                onChange={(e) => handleEstruturaChange(() => setNumeroParcelas(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_primeiro_vencimento">{comEntrada ? "Data 1ª Parcela *" : "Data 1º Vencimento *"}</Label>
              <Input
                id="data_primeiro_vencimento"
                type="date"
                value={dataPrimeiroVencimento}
                onChange={(e) => handleEstruturaChange(() => setDataPrimeiroVencimento(e.target.value))}
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
              <div className="flex items-center justify-between">
                <Label>Parcelas (previsão de recebimento)</Label>
                <span className="text-xs text-muted-foreground">
                  Edite valor e vencimento de cada parcela
                </span>
              </div>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 w-10">Nº</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Vencimento</th>
                      <th className="text-right py-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelasPreview.map((p, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-2 align-middle">{p.numero}</td>
                        <td className="py-2 align-middle">
                          {p.isEntrada ? (
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">Entrada</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Parcela</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 align-middle">
                          <Input
                            type="date"
                            value={p.data}
                            onChange={(e) => updateParcelaPreview(index, { data: e.target.value })}
                            className="h-8"
                          />
                        </td>
                        <td className="py-2 align-middle">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.valor}
                            onChange={(e) =>
                              updateParcelaPreview(index, { valor: parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Soma das parcelas: <span className="font-medium text-foreground">{fmtBRL(somaParcelas)}</span>
                </span>
                {divergenciaParcelas && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Difere do valor total ({fmtBRL(totalNum)})
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="com_exito"
            checked={comExito}
            onCheckedChange={(checked) => {
              setComExito(checked === true);
              if (!checked) {
                setExitoPercentual("");
                setExitoBase("");
                setExitoDataPrevista("");
              }
            }}
          />
          <Label htmlFor="com_exito" className="font-normal cursor-pointer">
            Possui percentual de êxito a receber no final?
          </Label>
        </div>

        {comExito && (
          <div className="space-y-3 pl-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exito_percentual">Percentual (%) *</Label>
                <Input
                  id="exito_percentual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={exitoPercentual}
                  onChange={(e) => setExitoPercentual(e.target.value)}
                  placeholder="Ex: 30"
                  required={comExito}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exito_base">Valor base estimado (R$) *</Label>
                <Input
                  id="exito_base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={exitoBase}
                  onChange={(e) => setExitoBase(e.target.value)}
                  placeholder="Ex: valor da causa"
                  required={comExito}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exito_data_prevista">Previsão de êxito (opcional)</Label>
              <Input
                id="exito_data_prevista"
                type="date"
                value={exitoDataPrevista}
                onChange={(e) => setExitoDataPrevista(e.target.value)}
              />
            </div>

            {exitoPercentual && exitoBase && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Valor estimado de êxito: </span>
                  <span className="font-semibold text-primary">
                    {fmtBRL((parseFloat(exitoBase) * parseFloat(exitoPercentual)) / 100)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Será lançado como crédito condicional vinculado a este contrato.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
        <Button type="submit" disabled={createAcordo.isPending || !clienteId}>
          {createAcordo.isPending ? "Criando..." : "Criar Contrato"}
        </Button>
      </div>
    </form>
  );
}
