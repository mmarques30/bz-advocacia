import { Processo, PROCESSO_STATUS_LABELS, TRIBUNAIS_OPCOES } from "@/types/processos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Lock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useUpdateProcesso } from "@/hooks/useProcessos";
import { useCanEditProcesso } from "@/hooks/useUsuarios";
import { useCreateHistorico } from "@/hooks/useProcessoHistorico";
import { toast } from "sonner";

interface ProcessoInformacoesTabProps {
  processo: Processo;
}

export function ProcessoInformacoesTab({ processo }: ProcessoInformacoesTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(processo);
  const updateProcesso = useUpdateProcesso();
  const { data: canEdit } = useCanEditProcesso();
  const createHistorico = useCreateHistorico();

  const handleSave = async () => {
    // Log changes to audited fields
    const auditFields: { campo: string; anterior: string; novo: string }[] = [];

    if (editData.numero_processo !== processo.numero_processo) {
      auditFields.push({
        campo: "numero_processo",
        anterior: processo.numero_processo || "",
        novo: editData.numero_processo || "",
      });
    }

    if (editData.valor !== processo.valor) {
      auditFields.push({
        campo: "valor",
        anterior: processo.valor?.toString() || "",
        novo: editData.valor?.toString() || "",
      });
    }

    if (editData.extrajudicial !== processo.extrajudicial) {
      auditFields.push({
        campo: "extrajudicial",
        anterior: processo.extrajudicial ? "Sim" : "Não",
        novo: editData.extrajudicial ? "Sim" : "Não",
      });
    }

    await updateProcesso.mutateAsync(editData);

    // Record audit entries
    for (const field of auditFields) {
      await createHistorico.mutateAsync({
        processo_id: processo.id,
        entidade_tipo: "processo",
        acao: "editar",
        campo_alterado: field.campo,
        valor_anterior: field.anterior,
        valor_novo: field.novo,
      });
    }

    toast.success("Processo atualizado com sucesso");
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              {processo.extrajudicial ? processo.codigo_interno : processo.numero_processo || "Sem número"}
              {processo.extrajudicial && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">Extrajudicial</Badge>
              )}
            </h3>
            <Badge>{PROCESSO_STATUS_LABELS[processo.status]}</Badge>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Tipo de Ação</Label>
            <p className="font-medium">{processo.tipo}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Tribunal/Vara</Label>
            <p className="font-medium">
              {[processo.tribunal, processo.vara].filter(Boolean).join(" - ") || "Não informado"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Comarca</Label>
            <p className="font-medium">{processo.comarca || "Não informado"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Cliente Vinculado</Label>
            <p className="font-medium">{processo.cliente?.nome_completo || "Não vinculado"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Parte Autora</Label>
            <p className="font-medium">{processo.autor || "Não informado"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Parte Ré</Label>
            <p className="font-medium">{processo.reu || "Não informado"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Valor da Causa</Label>
            <p className="font-medium">
              {processo.valor ? `R$ ${processo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Data de Início</Label>
            <p className="font-medium">{format(new Date(processo.data_inicio), "dd/MM/yyyy")}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Data Prevista de Conclusão</Label>
            <p className="font-medium">
              {processo.data_prevista_conclusao 
                ? format(new Date(processo.data_prevista_conclusao), "dd/MM/yyyy")
                : "Não definida"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Data de Distribuição</Label>
            <p className="font-medium">
              {processo.data_distribuicao 
                ? format(new Date(processo.data_distribuicao), "dd/MM/yyyy")
                : "Não informada"}
            </p>
          </div>
        </div>

        {processo.observacoes && (
          <div>
            <Label className="text-muted-foreground">Observações</Label>
            <p className="mt-1 text-sm whitespace-pre-wrap">{processo.observacoes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Extrajudicial toggle */}
        <div className="col-span-2 flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
          <Checkbox
            id="edit-extrajudicial"
            checked={editData.extrajudicial || false}
            onCheckedChange={(checked) => setEditData({ ...editData, extrajudicial: checked === true })}
          />
          <Label htmlFor="edit-extrajudicial" className="cursor-pointer">
            Processo extrajudicial (sem número CNJ)
          </Label>
        </div>

        {editData.extrajudicial ? (
          <div>
            <Label>Código Interno</Label>
            <Input value={editData.codigo_interno || "Será gerado automaticamente"} disabled className="bg-muted" />
          </div>
        ) : (
          <div>
            <Label className="flex items-center gap-1">
              Número do Processo
              {!canEdit && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              value={editData.numero_processo || ""}
              onChange={(e) => setEditData({ ...editData, numero_processo: e.target.value })}
              disabled={!canEdit}
              className={!canEdit ? "bg-muted" : ""}
            />
          </div>
        )}

        <div>
          <Label>Status</Label>
          <Select
            value={editData.status}
            onValueChange={(value: any) => setEditData({ ...editData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROCESSO_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Ação</Label>
          <Input
            value={editData.tipo}
            onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
          />
        </div>

        {!editData.extrajudicial && (
          <>
            <div>
              <Label>Tribunal</Label>
              <Select
                value={editData.tribunal || ""}
                onValueChange={(value) => setEditData({ ...editData, tribunal: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIBUNAIS_OPCOES.map((tribunal) => (
                    <SelectItem key={tribunal} value={tribunal}>
                      {tribunal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Comarca</Label>
              <Input
                value={editData.comarca || ""}
                onChange={(e) => setEditData({ ...editData, comarca: e.target.value })}
              />
            </div>

            <div>
              <Label>Vara</Label>
              <Input
                value={editData.vara || ""}
                onChange={(e) => setEditData({ ...editData, vara: e.target.value })}
              />
            </div>
          </>
        )}

        <div>
          <Label>Parte Autora</Label>
          <Input
            value={editData.autor || ""}
            onChange={(e) => setEditData({ ...editData, autor: e.target.value })}
          />
        </div>

        <div>
          <Label>Parte Ré</Label>
          <Input
            value={editData.reu || ""}
            onChange={(e) => setEditData({ ...editData, reu: e.target.value })}
          />
        </div>

        <div>
          <Label className="flex items-center gap-1">
            Valor da Causa
            {!canEdit && <Lock className="h-3 w-3 text-muted-foreground" />}
          </Label>
          <Input
            type="number"
            step="0.01"
            value={editData.valor || ""}
            onChange={(e) => setEditData({ ...editData, valor: e.target.value ? parseFloat(e.target.value) : null })}
            disabled={!canEdit}
            className={!canEdit ? "bg-muted" : ""}
          />
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={editData.observacoes || ""}
          onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={updateProcesso.isPending}>
          {updateProcesso.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
