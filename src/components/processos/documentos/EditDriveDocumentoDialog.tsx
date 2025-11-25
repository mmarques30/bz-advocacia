import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useUpdateDocumentoDrive } from "@/hooks/useDocumentosDrive";
import { DocumentoDrive, TipoDocumentoDrive, TIPO_DOCUMENTO_DRIVE_LABELS } from "@/types/documentos-drive";
import { validarLinkDrive } from "@/lib/driveUtils";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditDriveDocumentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: DocumentoDrive | null;
}

export function EditDriveDocumentoDialog({
  open,
  onOpenChange,
  documento,
}: EditDriveDocumentoDialogProps) {
  const [tipo, setTipo] = useState<TipoDocumentoDrive>("outros");
  const [nome, setNome] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataDocumento, setDataDocumento] = useState("");
  const [tags, setTags] = useState("");
  const [urlError, setUrlError] = useState("");

  const updateMutation = useUpdateDocumentoDrive();

  useEffect(() => {
    if (documento) {
      setTipo(documento.tipo_documento);
      setNome(documento.nome);
      setDriveUrl(documento.drive_url);
      setDescricao(documento.descricao || "");
      setDataDocumento(documento.data_documento || "");
      setTags(documento.tags?.join(", ") || "");
    }
  }, [documento]);

  const handleUrlChange = (value: string) => {
    setDriveUrl(value);
    if (value && !validarLinkDrive(value)) {
      setUrlError("Link inválido do Google Drive");
    } else {
      setUrlError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!documento) return;

    if (!validarLinkDrive(driveUrl)) {
      setUrlError("Por favor, insira um link válido do Google Drive");
      return;
    }

    updateMutation.mutate(
      {
        id: documento.id,
        tipo_documento: tipo,
        nome,
        drive_url: driveUrl,
        descricao: descricao || null,
        data_documento: dataDocumento || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!documento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
          <DialogDescription>
            Atualize as informações do documento vinculado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Documento *</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as TipoDocumentoDrive)}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_DOCUMENTO_DRIVE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Documento *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Petição Inicial - Divórcio Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driveUrl">Link do Google Drive *</Label>
            <Input
              id="driveUrl"
              type="url"
              value={driveUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              required
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{urlError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do documento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDocumento">Data do Documento (opcional)</Label>
            <Input
              id="dataDocumento"
              type="date"
              value={dataDocumento}
              onChange={(e) => setDataDocumento(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (opcional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="urgente, revisado, original (separadas por vírgula)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !!urlError}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
