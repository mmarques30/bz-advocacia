import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateDemanda } from "@/hooks/useDemandas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NewDemandaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  titulo: string;
  descricao: string;
  tipo: 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel_id: string;
}

export const NewDemandaDialog = ({ open, onOpenChange }: NewDemandaDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>();
  const createDemanda = useCreateDemanda();

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
    createDemanda.mutate({
      ...data,
      status: 'pendente',
      criado_por: null,
      responsavel_id: data.responsavel_id || null,
      data_conclusao: null,
    }, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Demanda Interna</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input 
              id="titulo" 
              {...register('titulo', { required: true })} 
              placeholder="Ex: Corrigir bug na exportação PDF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descreva a demanda em detalhes..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select onValueChange={(value) => setValue('tipo', value as any)} defaultValue="tarefa">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="melhoria">🔧 Melhoria</SelectItem>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="sugestao">💡 Sugestão</SelectItem>
                  <SelectItem value="tarefa">📋 Tarefa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select onValueChange={(value) => setValue('prioridade', value as any)} defaultValue="media">
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
            <Label>Responsável</Label>
            <Select onValueChange={(value) => setValue('responsavel_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem responsável</SelectItem>
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
            <Button type="submit" disabled={createDemanda.isPending}>
              {createDemanda.isPending ? 'Criando...' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};