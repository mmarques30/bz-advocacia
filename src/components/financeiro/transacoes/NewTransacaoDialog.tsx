import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateTransacao, useCategorias, useTipos, useSubcategorias } from "@/hooks/useTransacoesFinanceiras";
import { useAdvogadas } from "@/hooks/useAdvogadas";
import { CONTA_LABELS } from "@/types/financeiro";
import { toast } from "@/lib/toast";
import type { TransacaoFinanceira } from "@/types/transacoes";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: TransacaoFinanceira | null;
}

const MESES = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function NewTransacaoDialog({ open, onClose, initialData }: Props) {
  const [formKey, setFormKey] = useState(0);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipoCodigo, setTipoCodigo] = useState<string>("");
  const [categoriaCodigo, setCategoriaCodigo] = useState<string>("");
  const [subcategoriaCodigo, setSubcategoriaCodigo] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [dataTransacao, setDataTransacao] = useState("");
  const [valor, setValor] = useState("");
  const [conta, setConta] = useState("escritorio");
  const [responsavelProfileId, setResponsavelProfileId] = useState<string>("");

  const { data: categorias } = useCategorias();
  const { data: tipos } = useTipos();
  const { data: subcategorias } = useSubcategorias(categoriaCodigo);
  const { data: advogadas } = useAdvogadas();
  const createTransacao = useCreateTransacao();

  // Pre-fill from initialData (for duplication)
  useEffect(() => {
    if (initialData && open) {
      setMes(initialData.mes);
      setAno(initialData.ano);
      setTipoCodigo(initialData.tipo_codigo);
      setCategoriaCodigo(initialData.categoria_codigo);
      setSubcategoriaCodigo(initialData.subcategoria_codigo);
      setDescricao(initialData.descricao || "");
      setDataTransacao(""); // Clear date for duplication
      setValor(initialData.valor.toString());
      setConta(initialData.conta || "escritorio");
      setResponsavelProfileId(initialData.responsavel_profile_id || "");
    }
  }, [initialData, open]);

  // Auto-fill responsavel_profile_id quando a subcategoria indicar a socia.
  // Isso reproduz o comportamento legado do backfill: subcategoria ==
  // 'juliana'/'eliziane' → profile com aquele primeiro nome. Usuario pode
  // sobrescrever manualmente no select.
  useEffect(() => {
    if (!subcategoriaCodigo || !advogadas) return;
    const subLower = subcategoriaCodigo.toLowerCase();
    const match = advogadas.find(
      (a) => a.legacy_key === subLower || a.apelido === subLower,
    );
    if (match && !responsavelProfileId) {
      setResponsavelProfileId(match.id);
    }
  }, [subcategoriaCodigo, advogadas, responsavelProfileId]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoCodigo || !categoriaCodigo || !subcategoriaCodigo || !valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTransacao.mutateAsync({
        mes,
        ano,
        mes_nome: MESES.find((m) => m.value === mes)?.label || "",
        tipo_codigo: tipoCodigo,
        categoria_codigo: categoriaCodigo,
        subcategoria_codigo: subcategoriaCodigo,
        descricao: descricao || null,
        data_transacao: dataTransacao || null,
        valor: parseFloat(valor.replace(",", ".")),
        conta,
        // Grava a FK explicita quando o usuario selecionou uma advogada.
        // Mantemos tambem o subcategoria_codigo legado para compat com
        // consumidores que ainda fazem string match.
        responsavel_profile_id: responsavelProfileId || null,
      });

      toast.success("Transação criada com sucesso");
      resetForm();
      setFormKey((k) => k + 1);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar transação");
    }
  };

  const resetForm = () => {
    setMes(new Date().getMonth() + 1);
    setAno(new Date().getFullYear());
    setTipoCodigo("");
    setCategoriaCodigo("");
    setSubcategoriaCodigo("");
    setDescricao("");
    setDataTransacao("");
    setValor("");
    setConta("escritorio");
    setResponsavelProfileId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Duplicar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês *</Label>
              <Select
                value={mes.toString()}
                onValueChange={(v) => setMes(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano *</Label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipoCodigo} onValueChange={setTipoCodigo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos?.map((tipo) => (
                  <SelectItem key={tipo.codigo} value={tipo.codigo}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select
              value={categoriaCodigo}
              onValueChange={(v) => {
                setCategoriaCodigo(v);
                setSubcategoriaCodigo("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.codigo} value={cat.codigo}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subcategoria *</Label>
            <Select
              value={subcategoriaCodigo}
              onValueChange={setSubcategoriaCodigo}
              disabled={!categoriaCodigo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a subcategoria" />
              </SelectTrigger>
              <SelectContent>
                {subcategorias?.map((sub) => (
                  <SelectItem key={sub.codigo} value={sub.codigo}>
                    {sub.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data da Transação</Label>
            <Input
              type="date"
              value={dataTransacao}
              onChange={(e) => setDataTransacao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor *</Label>
            <Input
              type="text"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Conta *</Label>
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

          {/*
            Advogada responsavel (Fase B do refactor de subcategoria):
            grava a FK explicita em responsavel_profile_id para poder
            eliminar a heuristica de string match em fase futura.
            Pre-preenchido automaticamente quando a subcategoria for
            "juliana"/"eliziane" (backfill do hook legado).
          */}
          {advogadas && advogadas.length > 0 && (
            <div className="space-y-2">
              <Label>Advogada Responsável</Label>
              <Select
                value={responsavelProfileId || "__none__"}
                onValueChange={(v) => setResponsavelProfileId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma (B&Z)</SelectItem>
                  {advogadas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descrição da transação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTransacao.isPending}>
              {createTransacao.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
