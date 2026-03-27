import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Video, Plus, ExternalLink, Pencil, Trash2, Link, FileText, Upload, Download, Loader2 } from "lucide-react";
import { useTreinamentos, useCreateTreinamento, useUpdateTreinamento, useDeleteTreinamento } from "@/hooks/useTreinamentos";
import { useIsAdvogada } from "@/hooks/useIsAdvogada";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIAS = ["geral", "vendas", "processos", "financeiro", "sistema"];

export default function Treinamentos() {
  const { data: treinamentos, isLoading } = useTreinamentos();
  const createMutation = useCreateTreinamento();
  const updateMutation = useUpdateTreinamento();
  const deleteMutation = useDeleteTreinamento();
  const { isAdvogada } = useIsAdvogada();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [categoria, setCategoria] = useState("geral");
  const [formato, setFormato] = useState<"link" | "documento">("link");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setDriveUrl("");
    setCategoria("geral");
    setFormato("link");
    setSelectedFile(null);
    setEditId(null);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("treinamentos").upload(path, file);
    if (error) throw error;
    return path;
  };

  const getSignedUrl = async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("treinamentos")
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  const handleSubmit = async () => {
    if (!titulo) return;
    if (formato === "link" && !driveUrl) return;
    if (formato === "documento" && !selectedFile && !editId) return;

    try {
      let finalUrl = driveUrl;

      if (formato === "documento" && selectedFile) {
        setUploading(true);
        const path = await uploadFile(selectedFile);
        finalUrl = path; // store the storage path
      }

      if (editId) {
        updateMutation.mutate(
          { id: editId, titulo, descricao, drive_url: finalUrl, categoria, formato },
          { onSuccess: () => { setOpen(false); resetForm(); } }
        );
      } else {
        createMutation.mutate(
          { titulo, descricao, drive_url: finalUrl, categoria, formato },
          { onSuccess: () => { setOpen(false); resetForm(); } }
        );
      }
    } catch (e: any) {
      toast.error("Erro no upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditId(t.id);
    setTitulo(t.titulo);
    setDescricao(t.descricao || "");
    setDriveUrl(t.drive_url);
    setCategoria(t.categoria || "geral");
    setFormato(t.formato || "link");
    setSelectedFile(null);
    setOpen(true);
  };

  const handleOpenItem = async (t: any) => {
    if (t.formato === "documento") {
      try {
        const url = await getSignedUrl(t.drive_url);
        window.open(url, "_blank");
      } catch {
        toast.error("Erro ao abrir documento");
      }
    } else {
      window.open(t.drive_url, "_blank");
    }
  };

  const isFormValid = titulo && (formato === "link" ? driveUrl : (selectedFile || editId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Treinamentos
          </h2>
          <p className="text-muted-foreground mt-1">Vídeos e materiais de treinamento da plataforma</p>
        </div>
        {isAdvogada && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar Treinamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título *" value={titulo} onChange={e => setTitulo(e.target.value)} />
                <Textarea placeholder="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Formato</Label>
                  <RadioGroup value={formato} onValueChange={(v) => setFormato(v as "link" | "documento")} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="link" id="fmt-link" />
                      <Label htmlFor="fmt-link" className="flex items-center gap-1 cursor-pointer">
                        <Link className="h-4 w-4" /> Link externo
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="documento" id="fmt-doc" />
                      <Label htmlFor="fmt-doc" className="flex items-center gap-1 cursor-pointer">
                        <FileText className="h-4 w-4" /> Documento
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formato === "link" ? (
                  <Input placeholder="URL do link *" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? selectedFile.name : (editId ? "Substituir arquivo" : "Selecionar arquivo *")}
                    </Button>
                    {editId && !selectedFile && (
                      <p className="text-xs text-muted-foreground">Arquivo atual mantido. Selecione outro para substituir.</p>
                    )}
                  </div>
                )}

                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit} disabled={!isFormValid || uploading} className="w-full">
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : (editId ? "Salvar" : "Adicionar")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !treinamentos?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum treinamento cadastrado</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {treinamentos.map(t => (
            <Card key={t.id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {t.formato === "documento" ? (
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Link className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <h3 className="font-semibold truncate">{t.titulo}</h3>
                    </div>
                    {t.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{t.descricao}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {t.categoria?.charAt(0).toUpperCase() + t.categoria?.slice(1)}
                      </span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {t.formato === "documento" ? "Documento" : "Link"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleOpenItem(t)}>
                      {t.formato === "documento" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    </Button>
                    {isAdvogada && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
