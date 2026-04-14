import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, ExternalLink, Link2, Check, Copy, Edit2 } from "lucide-react";
import { ProcessoDriveDocumentosSection } from "../documentos/ProcessoDriveDocumentosSection";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";

interface ProcessoDocumentosTabProps {
  processoId: string;
  pastaDriveUrl?: string | null;
}

export function ProcessoDocumentosTab({ processoId, pastaDriveUrl }: ProcessoDocumentosTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [driveUrl, setDriveUrl] = useState(pastaDriveUrl || "");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const updateDriveUrl = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("processos")
        .update({ pasta_drive_url: url || null })
        .eq("id", processoId);
      
      if (error) throw error;
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-detalhes", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      setIsEditing(false);
      toast({
        title: "Link atualizado",
        description: "O link da pasta do Google Drive foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateDriveUrl.mutate(driveUrl);
  };

  const handleCopy = () => {
    if (pastaDriveUrl) {
      navigator.clipboard.writeText(pastaDriveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção da Pasta do Google Drive */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pasta do Google Drive</CardTitle>
          </div>
          <CardDescription>
            Link da pasta do cliente no Google Drive para acesso rápido aos documentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={updateDriveUrl.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDriveUrl(pastaDriveUrl || "");
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : pastaDriveUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{pastaDriveUrl}</span>
              </div>
              <Button
                variant="default"
                onClick={() => window.open(pastaDriveUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-muted/50 rounded-md border-2 border-dashed">
                <span className="text-sm text-muted-foreground">
                  Nenhum link cadastrado
                </span>
              </div>
              <Button onClick={() => setIsEditing(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Seção de Documentos do Google Drive */}
      <ProcessoDriveDocumentosSection processoId={processoId} />
    </div>
  );
}
