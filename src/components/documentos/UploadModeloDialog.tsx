import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { useAnalyzeDocument, useSaveModelo } from "@/hooks/useModelosDocumentos";
import { toast } from "sonner";

interface UploadModeloDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogState = 'idle' | 'uploading' | 'analyzing' | 'preview';

const CATEGORIAS = [
  { value: 'saude', label: 'Saúde' },
  { value: 'familia', label: 'Família' },
  { value: 'civel', label: 'Cível' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'previdenciario', label: 'Previdenciário' },
];

export const UploadModeloDialog = ({ open, onOpenChange }: UploadModeloDialogProps) => {
  const [state, setState] = useState<DialogState>('idle');
  const [tipo, setTipo] = useState<'proposta' | 'contrato'>('proposta');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Resultado da análise
  const [servicoPadrao, setServicoPadrao] = useState('');
  const [descricaoModelo, setDescricaoModelo] = useState('');
  const [variaveis, setVariaveis] = useState<string[]>([]);

  const analyzeDocument = useAnalyzeDocument();
  const saveModelo = useSaveModelo();

  const handleFileUpload = useCallback(async (file: File) => {
    setState('uploading');
    setFileName(file.name);

    try {
      // Ler conteúdo do arquivo
      const text = await file.text();
      setFileContent(text);
      setState('idle');
      toast.success(`Arquivo "${file.name}" carregado`);
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast.error('Erro ao ler arquivo');
      setState('idle');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleAnalyze = async () => {
    if (!fileContent) {
      toast.error('Faça upload de um documento primeiro');
      return;
    }
    if (!nome) {
      toast.error('Preencha o nome do modelo');
      return;
    }

    setState('analyzing');
    try {
      const result = await analyzeDocument.mutateAsync({ content: fileContent, tipo });
      
      setServicoPadrao(result.servico_padrao);
      setDescricaoModelo(result.descricao_modelo);
      setVariaveis(result.variaveis);
      
      // Auto-selecionar categoria se identificada
      if (result.tipo_identificado && CATEGORIAS.some(c => c.value === result.tipo_identificado)) {
        setCategoria(result.tipo_identificado);
      }
      
      setState('preview');
      toast.success('Documento analisado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao analisar:', error);
      toast.error(error.message || 'Erro ao analisar documento');
      setState('idle');
    }
  };

  const handleSave = async () => {
    if (!categoria) {
      toast.error('Selecione uma categoria');
      return;
    }

    try {
      await saveModelo.mutateAsync({
        nome,
        tipo,
        categoria,
        servico_padrao: servicoPadrao,
        descricao: descricaoModelo,
        variaveis,
      });
      
      // Reset e fechar
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setState('idle');
    setTipo('proposta');
    setNome('');
    setCategoria('');
    setFileContent('');
    setFileName('');
    setServicoPadrao('');
    setDescricaoModelo('');
    setVariaveis([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Modelo com IA
          </DialogTitle>
          <DialogDescription>
            Faça upload de um documento e a IA irá analisar e criar um modelo reutilizável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {state !== 'preview' && (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  fileContent ? 'border-green-500 bg-green-50' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {state === 'uploading' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Carregando arquivo...</p>
                  </div>
                ) : fileContent ? (
                  <div className="flex flex-col items-center gap-2">
                    <Check className="h-8 w-8 text-green-600" />
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {fileContent.length.toLocaleString()} caracteres
                    </p>
                    <label className="cursor-pointer text-sm text-primary hover:underline">
                      Trocar arquivo
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.doc,.docx,.pdf"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">Arraste um documento aqui</p>
                      <p className="text-sm text-muted-foreground">
                        ou clique para selecionar (TXT, DOCX, PDF)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>

              {/* Tipo de Modelo */}
              <div className="space-y-2">
                <Label>Tipo de Modelo</Label>
                <RadioGroup
                  value={tipo}
                  onValueChange={(v) => setTipo(v as 'proposta' | 'contrato')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="proposta" id="proposta" />
                    <Label htmlFor="proposta" className="cursor-pointer">
                      Proposta (visual 4 páginas)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contrato" id="contrato" />
                    <Label htmlFor="contrato" className="cursor-pointer">
                      Contrato (texto estruturado)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Nome e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Modelo *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Proposta - Ação de Saúde"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão Analisar */}
              <Button
                onClick={handleAnalyze}
                disabled={!fileContent || !nome || state === 'analyzing'}
                className="w-full"
                size="default"
              >
                {state === 'analyzing' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </>
          )}

          {/* Preview do Resultado */}
          {state === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Análise concluída!</span>
              </div>

              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Tipo Identificado</Label>
                    <Badge variant="secondary" className="mt-1">
                      {CATEGORIAS.find(c => c.value === categoria)?.label || categoria}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição do Serviço</Label>
                    <Textarea
                      value={servicoPadrao}
                      onChange={(e) => setServicoPadrao(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição do Modelo</Label>
                    <Input
                      value={descricaoModelo}
                      onChange={(e) => setDescricaoModelo(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Variáveis Detectadas</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {variaveis.map((v) => (
                        <Badge key={v} variant="outline">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setState('idle')} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveModelo.isPending || !categoria}
                  className="flex-1"
                >
                  {saveModelo.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Salvar Modelo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
