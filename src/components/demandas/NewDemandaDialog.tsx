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
  defaultProcessoId?: string | null;
}

interface FormData {
  titulo: string;
  descricao: string;
  tipo: 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria: 'processos' | 'vendas' | 'pagamentos' | 'administrativo' | 'geral';
  responsavel_id: string;
  processo_id: string;
  data_limite: string;
}

export const NewDemandaDialog = ({ open, onOpenChange, defaultProcessoId }: NewDemandaDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      tipo: 'tarefa',
      prioridade: 'media',
      categoria: 'geral',
      processo_id: defaultProcessoId || '',
    }
  });
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

  const { data: processos } = useQuery({
    queryKey: ['processos-demandas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('id, numero_processo, tipo')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = (data: FormData) => {
    createDemanda.mutate({
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      prioridade: data.prioridade,
      categoria: data.categoria,
      status: 'pendente',
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      processo_id: data.processo_id === 'sem_processo' ? null : data.processo_id || null,
      data_limite: data.data_limite || null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input 
              id="titulo" 
              {...register('titulo', { required: true })} 
              placeholder="Ex: Revisar contrato do processo X"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descreva a demanda em detalhes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select onValueChange={(value) => setValue('categoria', value as any)} defaultValue="geral">
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
              <Select onValueChange={(value) => setValue('tipo', value as any)} defaultValue="tarefa">
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

            <div className="space-y-2">
              <Label htmlFor="data_limite">Data Limite</Label>
              <Input
                id="data_limite"
                type="date"
                {...register('data_limite')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Processo Relacionado</Label>
            <Select onValueChange={(value) => setValue('processo_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um processo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_processo">Nenhum processo</SelectItem>
                {processos?.map((processo) => (
                  <SelectItem key={processo.id} value={processo.id}>
                    {processo.numero_processo || processo.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select onValueChange={(value) => setValue('responsavel_id', value)}>
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
            <Button type="submit" disabled={createDemanda.isPending}>
              {createDemanda.isPending ? 'Criando...' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
