import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateDespesa } from "@/hooks/useDespesas";
import { useProcessos } from "@/hooks/useProcessos";
import {
  CATEGORIA_DESPESA_LABELS,
  FORMA_PAGAMENTO_RECEBIDO_LABELS,
  STATUS_DESPESA_LABELS,
  CONTA_LABELS,
} from "@/types/financeiro";
import type {
  Despesa,
  CategoriaDespesa,
  StatusDespesa,
  FormaPagamentoRecebido,
} from "@/types/financeiro";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { toast } from "@/lib/toast";

interface NewDespesaDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Despesa existente para pre-preencher o form (fluxo "Duplicar").
   * Os valores sao copiados mas o id e a data de pagamento nao — o
   * usuario confirma e cria um novo lancamento. Pass null para novo.
   */
  initialData?: Despesa | null;
}

export function NewDespesaDialog({ open, onClose, initialData }: NewDespesaDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [categoria, setCategoria] = useState<CategoriaDespesa | "">("");
  const [processoId, setProcessoId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRecebido | "">("");
  const [status, setStatus] = useState<StatusDespesa>("pendente");
  const [observacoes, setObservacoes] = useState("");
  const [conta, setConta] = useState("escritorio");

  // Parcelas — default 1 parcela (comportamento antigo inalterado).
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [intervaloDias, setIntervaloDias] = useState<number>(30);

  const createDespesa = useCreateDespesa();
  const { data: processos } = useProcessos({ status: undefined });
  const { data: categoriasDespesaDb } = useOpcoesSistema("categoria_despesa", true);

  const categoriasEntries =
    categoriasDespesaDb && categoriasDespesaDb.length > 0
      ? categoriasDespesaDb.map((o) => [o.valor, o.label] as [string, string])
      : Object.entries(CATEGORIA_DESPESA_LABELS);

  // Pre-preencher do initialData quando o dialog abre com despesa existente.
  useEffect(() => {
    if (initialData && open) {
      setDescricao(initialData.descricao || "");
      setValor(initialData.valor?.toString() || "");
      // Data de competencia: usamos a data de hoje como default, nao a
      // da despesa original (duplicar significa criar novo lancamento).
      setData(new Date());
      setCategoria(initialData.categoria);
      setProcessoId(initialData.processo_id || "");
      setFormaPagamento(initialData.forma_pagamento || "");
      // Status: novo lancamento comeca como pendente independente do original.
      setStatus("pendente");
      setObservacoes(initialData.observacoes || "");
      setConta(initialData.conta || "escritorio");
      setNumeroParcelas(1);
      setIntervaloDias(30);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao || !valor || !data || !categoria) {
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero");
      return;
    }

    const n = Math.max(1, Math.floor(numeroParcelas));

    // Caso simples (1 parcela): preserva o comportamento antigo 100%.
    if (n === 1) {
      createDespesa.mutate(
        {
          descricao,
          valor: valorNumerico,
          data: format(data, "yyyy-MM-dd"),
          categoria,
          processo_id: processoId || null,
          forma_pagamento: formaPagamento || null,
          status,
          observacoes: observacoes || null,
          anexo_url: null,
          conta,
        },
        {
          onSuccess: () => {
            handleClose();
            createDespesa.reset();
          },
          onError: () => {
            createDespesa.reset();
          },
        },
      );
      return;
    }

    // Parcelas: cria N lancamentos com datas espacadas por intervaloDias.
    // Valor de cada parcela = total / N (arredondado em centavos), com
    // ajuste de diferenca na ultima para evitar perda por arredondamento.
    const valorParcelaBase = Math.round((valorNumerico / n) * 100) / 100;
    const somaBase = valorParcelaBase * (n - 1);
    const ultimaParcela = Math.round((valorNumerico - somaBase) * 100) / 100;

    try {
      for (let i = 0; i < n; i++) {
        const dataParcela = addDays(data, i * intervaloDias);
        const valorParcela = i === n - 1 ? ultimaParcela : valorParcelaBase;
        await createDespesa.mutateAsync({
          descricao: `${descricao} (${i + 1}/${n})`,
          valor: valorParcela,
          data: format(dataParcela, "yyyy-MM-dd"),
          categoria,
          processo_id: processoId || null,
          forma_pagamento: formaPagamento || null,
          status: i === 0 ? status : "pendente",
          observacoes: observacoes || null,
          anexo_url: null,
          conta,
        });
      }
      toast.success(`${n} parcelas de despesa criadas com sucesso`);
      handleClose();
      createDespesa.reset();
    } catch (error) {
      createDespesa.reset();
      toast.error(
        "Erro ao criar parcelas: " +
          (error instanceof Error ? error.message : "desconhecido"),
      );
    }
  };

  const handleClose = () => {
    setDescricao("");
    setValor("");
    setData(new Date());
    setCategoria("");
    setProcessoId("");
    setFormaPagamento("");
    setStatus("pendente");
    setObservacoes("");
    setConta("escritorio");
    setNumeroParcelas(1);
    setIntervaloDias(30);
    onClose();
  };

  const modoDuplicacao = !!initialData;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modoDuplicacao ? "Duplicar Despesa" : "Nova Despesa"}</DialogTitle>
          {modoDuplicacao && (
            <DialogDescription>
              Os dados foram copiados da despesa original. Ajuste o que for necessário e salve
              para criar um novo lançamento.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Aluguel do escritório"
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
                placeholder="0,00"
                required
              />
              {numeroParcelas > 1 && valor && (
                <p className="text-xs text-muted-foreground">
                  Cada parcela: R${" "}
                  {(parseFloat(valor) / numeroParcelas).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  (última ajusta diferença)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Competência *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground",
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {numeroParcelas > 1
                  ? "Vencimento da 1ª parcela"
                  : "Mês de referência da despesa"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={categoria}
                onValueChange={(value) => setCategoria(value as CategoriaDespesa)}
                required
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasEntries.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processo">Processo (opcional)</Label>
              <Select
                value={processoId || "none"}
                onValueChange={(val) => setProcessoId(val === "none" ? "" : val)}
              >
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
              <Select
                value={formaPagamento || "none"}
                onValueChange={(value) =>
                  setFormaPagamento(value === "none" ? "" : (value as FormaPagamentoRecebido))
                }
              >
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
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as StatusDespesa)}
              >
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

            <div className="space-y-2">
              <Label htmlFor="conta">Conta *</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger id="conta">
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
          </div>

          {/* Parcelamento — oculto sob um "accordion" visual via condicao */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Parcelamento (opcional)
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numero_parcelas">Número de parcelas</Label>
                <Input
                  id="numero_parcelas"
                  type="number"
                  min="1"
                  max="60"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalo_dias">Intervalo entre parcelas (dias)</Label>
                <Input
                  id="intervalo_dias"
                  type="number"
                  min="1"
                  max="365"
                  value={intervaloDias}
                  onChange={(e) => setIntervaloDias(parseInt(e.target.value) || 30)}
                  disabled={numeroParcelas <= 1}
                />
              </div>
            </div>
            {numeroParcelas > 1 && (
              <p className="text-xs text-muted-foreground">
                Serão criados {numeroParcelas} lançamentos, espaçados de {intervaloDias} em{" "}
                {intervaloDias} dias a partir da data de competência. Apenas o primeiro herda o
                status selecionado; os demais começam como Pendente.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a despesa..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDespesa.isPending}>
              {createDespesa.isPending
                ? "Salvando..."
                : numeroParcelas > 1
                  ? `Salvar ${numeroParcelas} parcelas`
                  : modoDuplicacao
                    ? "Duplicar"
                    : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
