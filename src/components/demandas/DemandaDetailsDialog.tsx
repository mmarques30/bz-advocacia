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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";

interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  responsavel_id: string | null;
  data_conclusao: string | null;
  created_at: string;
  criador?: { nome_completo: string };
  responsavel?: { nome_completo: string };
}

interface DemandaDetailsDialogProps {
  demanda: Demanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isAdmin: boolean;
}

export const DemandaDetailsDialog = ({ demanda, open, onOpenChange, isEditing, isAdmin }: DemandaDetailsDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const updateDemanda = useUpdateDemanda();

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
        responsavel_id: demanda.responsavel_id || 'sem_responsavel',
      });
    }
  }, [demanda, reset]);

  const onSubmit = (data: any) => {
    if (!demanda) return;
    
    updateDemanda.mutate({
      id: demanda.id,
      ...data,
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      data_conclusao: data.status === 'concluido' ? new Date().toISOString().split('T')[0] : null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!demanda) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Demanda' : 'Detalhes da Demanda'}</DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{demanda.titulo}</h3>
              <div className="flex gap-2 mb-4">
                <Badge>{demanda.tipo}</Badge>
                <Badge>{demanda.status}</Badge>
                <Badge>{demanda.prioridade}</Badge>
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
                <Label>Criado por</Label>
                <p className="text-sm mt-1">{demanda.criador?.nome_completo || '-'}</p>
              </div>
              <div>
                <Label>Responsável</Label>
                <p className="text-sm mt-1">{demanda.responsavel?.nome_completo || '-'}</p>
              </div>
              <div>
                <Label>Criado em</Label>
                <p className="text-sm mt-1">
                  {format(new Date(demanda.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {demanda.data_conclusao && (
                <div>
                  <Label>Concluído em</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(demanda.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" {...register('titulo', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" {...register('descricao')} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select onValueChange={(value) => setValue('tipo', value)} value={watch('tipo')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="melhoria">Melhoria</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="tarefa">Tarefa</SelectItem>
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
              <Label>Status *</Label>
              <Select onValueChange={(value) => setValue('status', value)} value={watch('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
              </Select>
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

        {!isEditing && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};