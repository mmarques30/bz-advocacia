import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODELOS_CONTRATO } from "@/lib/contratoTemplates";
import { MODELOS_PROPOSTA } from "@/lib/propostaTemplates";
import { TIPOS_CONTRATO } from "@/types/contratos";
import { FileText, Eye, Sparkles, Pencil, Trash2, Copy, FileSignature, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadModeloDialog } from "./UploadModeloDialog";
import { EditModeloDialog } from "./EditModeloDialog";
import {
  useModelosPersonalizados,
  useDeleteModelo,
  useDuplicarModelo,
  ModeloConteudo,
  ModeloPersonalizado,
} from "@/hooks/useModelosDocumentos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";

type TipoFiltro = 'todos' | 'contrato' | 'proposta';

const HIDDEN_MODELS_KEY = 'hidden_default_models';

function getHiddenModels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_MODELS_KEY) || '[]');
  } catch {
    return [];
  }
}

function hideDefaultModel(id: string) {
  const hidden = getHiddenModels();
  if (!hidden.includes(id)) {
    localStorage.setItem(HIDDEN_MODELS_KEY, JSON.stringify([...hidden, id]));
  }
}

function restoreAllDefaultModels() {
  localStorage.removeItem(HIDDEN_MODELS_KEY);
}

export function ModelosContrato() {
  const [previewModelo, setPreviewModelo] = useState<{ nome: string; template: string } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editModelo, setEditModelo] = useState<ModeloPersonalizado | null>(null);
  const [deleteModelo, setDeleteModelo] = useState<ModeloPersonalizado | null>(null);
  const [deletePadraoId, setDeletePadraoId] = useState<string | null>(null);
  const [deletePadraoNome, setDeletePadraoNome] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [hiddenModels, setHiddenModels] = useState<string[]>(getHiddenModels);
  const [savingPadraoId, setSavingPadraoId] = useState<string | null>(null);

  const { data: modelosContratos = [] } = useModelosPersonalizados('contrato');
  const { data: modelosPropostas = [] } = useModelosPersonalizados('proposta');
  const deleteModeloMutation = useDeleteModelo();
  const duplicarModeloMutation = useDuplicarModelo();
  const queryClient = useQueryClient();

  const modelosPersonalizados = useMemo(() => {
    return [...modelosContratos, ...modelosPropostas];
  }, [modelosContratos, modelosPropostas]);

  const getTipoLabel = (tipo: string) => {
    return TIPOS_CONTRATO.find(t => t.value === tipo)?.label || tipo;
  };

  const modelosPersonalizadosFormatados = useMemo(() => {
    return modelosPersonalizados.map(m => {
      let conteudo: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'contrato', fonte: 'upload_ia' };
      try {
        conteudo = JSON.parse(m.conteudo);
      } catch {}
      return {
        ...m,
        descricaoFormatada: m.descricao || conteudo.servico_padrao,
        template: conteudo.servico_padrao,
      };
    });
  }, [modelosPersonalizados]);

  // All default models combined, filtering hidden ones
  const todosPadrao = useMemo(() => {
    const contratos = MODELOS_CONTRATO.map(m => ({ ...m, docType: 'contrato' as const }));
    const propostas = MODELOS_PROPOSTA.map(m => ({ ...m, docType: 'proposta' as const }));
    return [...contratos, ...propostas].filter(m => !hiddenModels.includes(m.id));
  }, [hiddenModels]);

  // Category counts
  const categoriasComContagem = useMemo(() => {
    const contagem: Record<string, number> = {};
    const filtered = tipoFiltro === 'todos'
      ? modelosPersonalizadosFormatados
      : modelosPersonalizadosFormatados.filter(m => m.tipo === tipoFiltro);
    
    filtered.forEach(m => {
      const cat = m.categoria || 'outro';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });

    const filteredPadrao = tipoFiltro === 'todos'
      ? todosPadrao
      : todosPadrao.filter(m => m.docType === tipoFiltro);

    filteredPadrao.forEach(m => {
      contagem[m.tipo] = (contagem[m.tipo] || 0) + 1;
    });

    const total = filtered.length + filteredPadrao.length;
    return { contagem, total };
  }, [modelosPersonalizadosFormatados, todosPadrao, tipoFiltro]);

  const categoriasAtivas = useMemo(() => {
    return TIPOS_CONTRATO.filter(t => categoriasComContagem.contagem[t.value]);
  }, [categoriasComContagem]);

  // Filtering
  const personalizadosFiltrados = useMemo(() => {
    let result = modelosPersonalizadosFormatados;
    if (tipoFiltro !== 'todos') {
      result = result.filter(m => m.tipo === tipoFiltro);
    }
    if (categoriaFiltro !== 'todos') {
      result = result.filter(m => m.categoria === categoriaFiltro);
    }
    return result;
  }, [modelosPersonalizadosFormatados, categoriaFiltro, tipoFiltro]);

  const padraoFiltrados = useMemo(() => {
    let result = todosPadrao;
    if (tipoFiltro !== 'todos') {
      result = result.filter(m => m.docType === tipoFiltro);
    }
    if (categoriaFiltro !== 'todos') {
      result = result.filter(m => m.tipo === categoriaFiltro);
    }
    return result;
  }, [todosPadrao, categoriaFiltro, tipoFiltro]);

  const handleDelete = () => {
    if (!deleteModelo) return;
    deleteModeloMutation.mutate(deleteModelo.id, {
      onSuccess: () => setDeleteModelo(null),
    });
  };

  const handleDeletePadrao = useCallback(() => {
    if (!deletePadraoId) return;
    hideDefaultModel(deletePadraoId);
    setHiddenModels(getHiddenModels());
    setDeletePadraoId(null);
    setDeletePadraoNome('');
    toast.success('Modelo padrão ocultado com sucesso');
  }, [deletePadraoId]);

  const handleRestaurarPadrao = useCallback(() => {
    restoreAllDefaultModels();
    setHiddenModels([]);
    toast.success('Modelos padrão restaurados');
  }, []);

  const handleEditarPadrao = useCallback(async (modelo: typeof todosPadrao[0]) => {
    setSavingPadraoId(modelo.id);
    try {
      const { data: user } = await supabase.auth.getUser();
      const conteudo: ModeloConteudo = {
        servico_padrao: modelo.template,
        tipo_modelo: modelo.docType,
        fonte: 'modelo_padrao',
        tipo_identificado: modelo.tipo,
      };

      const { data, error } = await supabase
        .from('templates')
        .insert({
          nome: modelo.nome,
          tipo: modelo.docType,
          categoria: modelo.tipo,
          conteudo: JSON.stringify(conteudo),
          descricao: modelo.descricao,
          ativo: true,
          variaveis: [],
          criado_por: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Hide the default model
      hideDefaultModel(modelo.id);
      setHiddenModels(getHiddenModels());

      // Invalidate queries to show new personalized model
      queryClient.invalidateQueries({ queryKey: ['modelos-personalizados'] });

      // Open edit dialog with the newly created model
      setEditModelo(data as ModeloPersonalizado);
      toast.success('Modelo salvo para edição');
    } catch (err) {
      console.error('Erro ao salvar modelo padrão:', err);
      toast.error('Erro ao preparar modelo para edição');
    } finally {
      setSavingPadraoId(null);
    }
  }, [queryClient]);

  const handleDuplicarPersonalizado = (modelo: typeof modelosPersonalizadosFormatados[0]) => {
    duplicarModeloMutation.mutate({
      nome: modelo.nome,
      tipo: modelo.tipo,
      categoria: modelo.categoria || 'outro',
      conteudo: modelo.conteudo,
      descricao: modelo.descricao,
      variaveis: modelo.variaveis,
    });
  };

  const handleUsarComoBase = (modelo: typeof todosPadrao[0]) => {
    const conteudo: ModeloConteudo = {
      servico_padrao: modelo.template,
      tipo_modelo: modelo.docType,
      fonte: 'modelo_padrao',
      tipo_identificado: modelo.tipo,
    };
    duplicarModeloMutation.mutate({
      nome: modelo.nome,
      tipo: modelo.docType,
      categoria: modelo.tipo,
      conteudo: JSON.stringify(conteudo),
      descricao: modelo.descricao,
      variaveis: null,
    });
  };

  const hasHiddenModels = hiddenModels.length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Modelos Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            {categoriasComContagem.total} modelo(s) disponível(is)
          </p>
        </div>
        <div className="flex gap-2">
          {hasHiddenModels && (
            <Button variant="outline" size="sm" onClick={handleRestaurarPadrao}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar padrão
            </Button>
          )}
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Criar Modelo com IA
          </Button>
        </div>
      </div>

      {/* Filtro por tipo (Contrato / Proposta) */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          variant={tipoFiltro === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTipoFiltro('todos'); setCategoriaFiltro('todos'); }}
        >
          Todos
        </Button>
        <Button
          variant={tipoFiltro === 'contrato' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTipoFiltro('contrato'); setCategoriaFiltro('todos'); }}
        >
          <FileSignature className="h-4 w-4 mr-1" />
          Contratos
        </Button>
        <Button
          variant={tipoFiltro === 'proposta' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTipoFiltro('proposta'); setCategoriaFiltro('todos'); }}
        >
          <FileText className="h-4 w-4 mr-1" />
          Propostas
        </Button>
      </div>

      {/* Filtros por categoria */}
      {categoriasAtivas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={categoriaFiltro === 'todos' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCategoriaFiltro('todos')}
          >
            Todas categorias
          </Button>
          {categoriasAtivas.map(cat => (
            <Button
              key={cat.value}
              variant={categoriaFiltro === cat.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCategoriaFiltro(cat.value)}
            >
              {cat.label} ({categoriasComContagem.contagem[cat.value]})
            </Button>
          ))}
        </div>
      )}

      {/* Modelos Personalizados */}
      {personalizadosFiltrados.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Modelos Personalizados
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalizadosFiltrados.map((modelo) => (
              <Card key={modelo.id} className="hover:border-primary/50 transition-colors border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{modelo.nome}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary">
                            {getTipoLabel(modelo.categoria || '')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {modelo.tipo === 'proposta' ? 'Proposta' : 'Contrato'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {modelo.descricaoFormatada}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditModelo(modelo)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicarPersonalizado(modelo)}
                      disabled={duplicarModeloMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteModelo(modelo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modelos Padrão */}
      {padraoFiltrados.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Modelos Padrão</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {padraoFiltrados.map((modelo) => (
              <Card key={modelo.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {modelo.docType === 'proposta' ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <FileSignature className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{modelo.nome}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary">
                            {getTipoLabel(modelo.tipo)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {modelo.docType === 'proposta' ? 'Proposta' : 'Contrato'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewModelo(modelo)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditarPadrao(modelo)}
                      disabled={savingPadraoId === modelo.id}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {savingPadraoId === modelo.id ? 'Salvando...' : 'Editar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { setDeletePadraoId(modelo.id); setDeletePadraoNome(modelo.nome); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {personalizadosFiltrados.length === 0 && padraoFiltrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum modelo encontrado nesta categoria.</p>
        </div>
      )}

      {/* Dialog de preview */}
      <Dialog open={!!previewModelo} onOpenChange={() => setPreviewModelo(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewModelo?.nome}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-6 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{previewModelo?.template}</pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <UploadModeloDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />

      <EditModeloDialog
        open={!!editModelo}
        onOpenChange={(open) => { if (!open) setEditModelo(null); }}
        modelo={editModelo}
      />

      {/* Alert para excluir modelo personalizado */}
      <AlertDialog open={!!deleteModelo} onOpenChange={(open) => { if (!open) setDeleteModelo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo "{deleteModelo?.nome}" será desativado. Essa ação pode ser revertida pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert para excluir modelo padrão */}
      <AlertDialog open={!!deletePadraoId} onOpenChange={(open) => { if (!open) { setDeletePadraoId(null); setDeletePadraoNome(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ocultar modelo padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo "{deletePadraoNome}" será ocultado da listagem. Você pode restaurá-lo a qualquer momento usando o botão "Restaurar padrão".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePadrao} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ocultar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
