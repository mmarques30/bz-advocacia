import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateSubtarefa } from "@/hooks/useSubtarefas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Demanda } from "@/types/demandas";

interface NewSubtarefaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentDemanda: Demanda;
  nextOrdem: number;
}

interface FormData {
  titulo: string;
  advogada_responsavel: string;
  responsavel_id: string;
  data_limite: string;
}

export const NewSubtarefaDialog = ({ open, onOpenChange, parentDemanda, nextOrdem }: NewSubtarefaDialogProps) => {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      advogada_responsavel: parentDemanda.advogada_responsavel || 'juliana',
    },
  });
  const createSubtarefa = useCreateSubtarefa();

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

  const onSubmit = (data: FormData) => {
    createSubtarefa.mutate({
      titulo: data.titulo,
      parent_id: parentDemanda.id,
      ordem: nextOrdem,
      advogada_responsavel: data.advogada_responsavel,
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      data_limite: data.data_limite || null,
      processo_id: parentDemanda.processo_id,
      lead_id: parentDemanda.lead_id,
      categoria: parentDemanda.categoria,
      tipo: 'tarefa',
      prioridade: parentDemanda.prioridade,
    }, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Nova Subtarefa</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Subtarefa #{nextOrdem} de "{parentDemanda.titulo}"
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo', { required: true })} placeholder="Ex: Pesquisar jurisprudência" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Advogada Responsável *</Label>
              <Select onValueChange={(v) => setValue('advogada_responsavel', v)} defaultValue={parentDemanda.advogada_responsavel || 'juliana'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="juliana">Juliana</SelectItem>
                  <SelectItem value="liziane">Liziane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_limite">Data Limite</Label>
              <Input id="data_limite" type="date" {...register('data_limite')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável (executor)</Label>
            <Select onValueChange={(v) => setValue('responsavel_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
                {usuarios?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createSubtarefa.isPending}>
              {createSubtarefa.isPending ? 'Criando...' : 'Criar Subtarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
