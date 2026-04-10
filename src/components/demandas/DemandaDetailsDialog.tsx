import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useUpdateDemanda } from "@/hooks/useDemandas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, parseISO, isValid } from "date-fns";

function safeFormatDate(dateStr: string | null, fmt = "dd/MM/yyyy"): string {
  if (!dateStr) return '-';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt, { locale: ptBR }) : '-';
  } catch { return '-'; }
}

function safeFormatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—';
  } catch { return '—'; }
}

function safeIsPast(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    return isValid(d) && isPast(d);
  } catch { return false; }
}
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Demanda, CATEGORIA_LABELS, TIPO_LABELS, STATUS_LABELS, PRIORIDADE_LABELS } from "@/types/demandas";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";
import { AlertCircle, GitBranch, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SubtarefasList } from "./SubtarefasList";
import { useSubtarefas } from "@/hooks/useSubtarefas";
import { ProcessoSearchInput } from "./ProcessoSearchInput";
import { useIsAdvogada } from "@/hooks/useIsAdvogada";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { toast } from "sonner";

const DEFAULT_STATUSES = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface DemandaDetailsDialogProps {
  demanda: Demanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isAdmin: boolean;
}

export const DemandaDetailsDialog = ({ demanda, open, onOpenChange, isEditing, isAdmin }: DemandaDetailsDialogProps) => {
  const advogadaLabels = useAdvogadaLabels();
  const navigate = useNavigate();
  const { data: statusDb } = useOpcoesSistema('status_tarefa', true);
  const statuses = statusDb && statusDb.length > 0
    ? statusDb.map(o => ({ value: o.valor, label: o.label }))
    : DEFAULT_STATUSES;
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const updateDemanda = useUpdateDemanda();
  const [localEditing, setLocalEditing] = useState(isEditing);
  const isParent = demanda ? !demanda.parent_id : false;
  const { data: subtarefas } = useSubtarefas(isParent && demanda ? demanda.id : null);
  const { isAdvogada } = useIsAdvogada();

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-demandas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo')
        .eq('ativo', true)
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
  });


  useEffect(() => {
    if (demanda) {
      reset({
        titulo: demanda.titulo,
        descricao: demanda.descricao,
        tipo: demanda.tipo,
        prioridade: demanda.prioridade,
        status: demanda.status,
        categoria: demanda.categoria || 'geral',
        advogada_responsavel: demanda.advogada_responsavel || 'juliana',
        responsavel_id: demanda.responsavel_id || 'sem_responsavel',
        processo_id: demanda.processo_id || 'sem_processo',
        data_limite: demanda.data_limite || '',
      });
    }
  }, [demanda, reset]);

  useEffect(() => {
    setLocalEditing(isEditing);
  }, [isEditing]);

  const onSubmit = (data: any) => {
    if (!demanda) return;

    // Block non-advogadas from completing tasks
    if (data.status === 'concluido' && !isAdvogada) {
      toast.error('Apenas advogadas podem concluir tarefas.');
      return;
    }

    // Block completing parent if subtasks are pending
    if (data.status === 'concluido' && isParent && subtarefas && subtarefas.length > 0) {
      const allDone = subtarefas.every(s => s.status === 'concluido');
      if (!allDone) {
        toast.error('Conclua todas as subtarefas antes de finalizar a tarefa-mãe.');
        return;
      }
    }
    
    updateDemanda.mutate({
      id: demanda.id,
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      prioridade: data.prioridade,
      status: data.status,
      categoria: data.categoria,
      advogada_responsavel: data.advogada_responsavel,
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      processo_id: data.processo_id === 'sem_processo' ? null : data.processo_id || null,
      data_limite: data.data_limite || null,
      data_conclusao: data.status === 'concluido' ? new Date().toISOString().split('T')[0] : null,
    }, {
      onSuccess: () => {
        setLocalEditing(false);
        onOpenChange(false);
      },
    });
  };

  if (!demanda) return null;

  const isAtrasada = safeIsPast(demanda.data_limite) && 
    !['concluido', 'cancelado'].includes(demanda.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{localEditing ? 'Editar Demanda' : 'Detalhes da Demanda'}</DialogTitle>
        </DialogHeader>

        {!localEditing ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isAtrasada && <AlertCircle className="h-5 w-5 text-destructive" />}
                <h3 className="font-semibold text-lg">{demanda.titulo}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">
                  {CATEGORIA_LABELS[demanda.categoria as keyof typeof CATEGORIA_LABELS] || 'Geral'}
                </Badge>
                <Badge>{TIPO_LABELS[demanda.tipo]}</Badge>
                <Badge>{STATUS_LABELS[demanda.status]}</Badge>
                <Badge>{PRIORIDADE_LABELS[demanda.prioridade]}</Badge>
              </div>
            </div>

            {demanda.descricao && (
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-muted-foreground mt-1">{demanda.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Advogada Responsável</Label>
                <p className="text-sm mt-1">{advogadaLabels[demanda.advogada_responsavel] || '-'}</p>
              </div>
              <div>
                <Label>Criado por</Label>
                <p className="text-sm mt-1">{demanda.criador?.nome_completo || '-'}</p>
              </div>
              <div>
                <Label>Responsável</Label>
                <p className="text-sm mt-1">{demanda.responsavel?.nome_completo || '-'}</p>
              </div>
              <div>
                <Label>Processo Relacionado</Label>
                {demanda.processo && demanda.processo_id ? (
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/dashboard/processos?id=${demanda.processo_id}`);
                    }}
                    className="flex items-center gap-1 text-sm mt-1 text-primary hover:underline"
                  >
                    {demanda.processo.numero_processo || demanda.processo.tipo}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <p className="text-sm mt-1">-</p>
                )}
              </div>
              <div>
                <Label>Data Limite</Label>
                <p className={cn("text-sm mt-1", isAtrasada && "text-destructive font-medium")}>
                  {safeFormatDate(demanda.data_limite)}
                  {isAtrasada && ' (Atrasada)'}
                </p>
              </div>
              <div>
                <Label>Criado em</Label>
                <p className="text-sm mt-1">
                  {safeFormatDateTime(demanda.created_at)}
                </p>
              </div>
              <div>
                <Label>Concluído em</Label>
                <p className="text-sm mt-1">
                  {safeFormatDateTime(demanda.concluida_em)}
                </p>
              </div>
            </div>

            {/* Subtarefas section */}
            {isParent && (
              <SubtarefasList parentDemanda={demanda} />
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" {...register('titulo', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" {...register('descricao')} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select onValueChange={(value) => setValue('categoria', value)} value={watch('categoria')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processos">Processos</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="pagamentos">Pagamentos</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select onValueChange={(value) => setValue('tipo', value)} value={watch('tipo')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarefa">Tarefa</SelectItem>
                    <SelectItem value="melhoria">Melhoria</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select onValueChange={(value) => setValue('status', value)} value={watch('status')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem 
                        key={s.value} 
                        value={s.value}
                        disabled={s.value === 'concluido' && !isAdvogada}
                      >
                        {s.label} {s.value === 'concluido' && !isAdvogada && '(apenas advogadas)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select onValueChange={(value) => setValue('prioridade', value)} value={watch('prioridade')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_limite">Data Limite</Label>
              <Input id="data_limite" type="date" {...register('data_limite')} />
            </div>

            <div className="space-y-2">
              <Label>Advogada Responsável *</Label>
              <Select onValueChange={(value) => setValue('advogada_responsavel', value)} value={watch('advogada_responsavel')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juliana">{advogadaLabels.juliana}</SelectItem>
                  <SelectItem value="liziane">{advogadaLabels.liziane}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Processo Relacionado</Label>
              <ProcessoSearchInput
                value={watch('processo_id') === 'sem_processo' ? null : watch('processo_id') || null}
                onChange={(id) => setValue('processo_id', id || 'sem_processo')}
              />
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select onValueChange={(value) => setValue('responsavel_id', value)} value={watch('responsavel_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
                  {usuarios?.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateDemanda.isPending}>
                {updateDemanda.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}

        {!localEditing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {isAdmin && (
              <Button onClick={() => setLocalEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
