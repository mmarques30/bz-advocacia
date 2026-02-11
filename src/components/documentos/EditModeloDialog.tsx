import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, History, Save, Loader2 } from "lucide-react";
import { TIPOS_CONTRATO } from "@/types/contratos";
import TemplateEditor from "@/components/templates/TemplateEditor";
import { extractVariables } from "@/lib/templateVariables";
import {
  ModeloPersonalizado,
  ModeloConteudo,
  useUpdateModelo,
  useModeloVersoes,
} from "@/hooks/useModelosDocumentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EditModeloDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: ModeloPersonalizado | null;
}

export function EditModeloDialog({ open, onOpenChange, modelo }: EditModeloDialogProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const updateModelo = useUpdateModelo();
  const { data: versoes = [] } = useModeloVersoes(modelo?.id || null);

  useEffect(() => {
    if (modelo) {
      setNome(modelo.nome);
      setCategoria(modelo.categoria || "");
      setDescricao(modelo.descricao || "");

      let parsed: ModeloConteudo = { servico_padrao: "", tipo_modelo: "", fonte: "" };
      try {
        parsed = JSON.parse(modelo.conteudo);
      } catch {}
      setConteudo(parsed.servico_padrao || "");
    }
  }, [modelo]);

  const detectedVariables = extractVariables(conteudo);

  const handleSave = () => {
    if (!modelo) return;
    updateModelo.mutate(
      {
        id: modelo.id,
        nome,
        categoria,
        descricao,
        conteudo,
        variaveis: detectedVariables,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Modelo</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Modelo</Label>
              <Input
                id="edit-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            {/* Categoria + Descrição */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTRATO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Editor de conteúdo */}
            <TemplateEditor
              value={conteudo}
              onChange={setConteudo}
              id="edit-conteudo"
            />

            {/* Variáveis detectadas */}
            {detectedVariables.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Variáveis detectadas ({detectedVariables.length}):
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVariables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs font-mono">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Versões */}
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Versões ({versoes.length})
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${historyOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {versoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">
                    Nenhuma versão anterior encontrada.
                  </p>
                ) : (
                  <div className="space-y-2 pt-2">
                    {versoes.map((v) => (
                      <div
                        key={v.id}
                        className="border rounded-lg p-3 text-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Versão {v.versao} — {v.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(v.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        {v.descricao && (
                          <p className="text-muted-foreground text-xs">
                            {v.descricao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateModelo.isPending || !nome}>
            {updateModelo.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
