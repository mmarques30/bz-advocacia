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
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";
import { useAdvogadas } from "@/hooks/useAdvogadas";
import { ProcessoSearchInput } from "./ProcessoSearchInput";
import { useEffect } from "react";

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
  categoria: string;
  advogada_responsavel: 'juliana' | 'liziane';
  responsavel_id: string;
  processo_id: string;
  data_limite: string;
  fase_processo: string;
  info_cliente: string;
}

export const NewDemandaDialog = ({ open, onOpenChange, defaultProcessoId }: NewDemandaDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      tipo: 'tarefa',
      prioridade: 'media',
      categoria: 'geral',
      advogada_responsavel: 'juliana',
      processo_id: defaultProcessoId || '',
    }
  });
  const createDemanda = useCreateDemanda();
  const { data: categoriasDb } = useOpcoesSistema('categoria_tarefa', true);
  const { data: fasesDb } = useOpcoesSistema('fase_processo', true);
  const advogadaLabels = useAdvogadaLabels();
  const { data: advogadas } = useAdvogadas();

  const categorias = categoriasDb && categoriasDb.length > 0
    ? categoriasDb.map(o => ({ value: o.valor, label: o.label }))
    : [
        { value: 'processos', label: 'Processos' },
        { value: 'vendas', label: 'Vendas' },
        { value: 'pagamentos', label: 'Pagamentos' },
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'geral', label: 'Geral' },
      ];

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

  const processoId = watch('processo_id');
  // Active processo id to fetch the lead from: prefer the one the user
  // currently has selected in the form (covers both defaultProcessoId and
  // manual selection via ProcessoSearchInput). Previously this query was
  // keyed only on defaultProcessoId, so tasks created from a manually-chosen
  // processo never had lead_id populated in demandas_internas.
  const activeProcessoId = processoId || defaultProcessoId || null;

  const { data: processoData } = useQuery({
    queryKey: ['processo-lead', activeProcessoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('lead_id')
        .eq('id', activeProcessoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeProcessoId,
  });

  const onSubmit = (data: FormData) => {
    // Use lead_id from the currently-linked processo when available.
    const leadId = activeProcessoId && processoData?.lead_id
      ? processoData.lead_id
      : null;

    createDemanda.mutate({
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      prioridade: data.prioridade,
      categoria: data.categoria,
      advogada_responsavel: data.advogada_responsavel,
      status: 'pendente',
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      processo_id: data.processo_id || null,
      lead_id: leadId,
      data_limite: data.data_limite || null,
      data_conclusao: null,
      fase_processo: data.fase_processo || null,
      info_cliente: data.info_cliente || null,
    } as any, {
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select onValueChange={(value) => setValue('categoria', value as any)} defaultValue="geral">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <ProcessoSearchInput
              value={processoId || null}
              onChange={(id) => setValue('processo_id', id || '')}
            />
          </div>

          {/* Fase do processo + info para o cliente (bot WhatsApp) */}
          {fasesDb && fasesDb.length > 0 && (
            <div className="space-y-2">
              <Label>Fase do Processo</Label>
              <Select onValueChange={(value) => setValue('fase_processo', value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fase (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {fasesDb.map((f) => (
                    <SelectItem key={f.valor} value={f.valor}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="info_cliente">Informação para o Cliente</Label>
            <Textarea
              id="info_cliente"
              {...register('info_cliente')}
              placeholder="Ex: Petição inicial protocolada em 15/04. Aguardando distribuição."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Texto que o bot poderá enviar ao cliente quando perguntar sobre o processo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Advogada Responsável *</Label>
            <Select onValueChange={(value) => setValue('advogada_responsavel', value as any)} defaultValue="juliana">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/*
                  Fase C: fonte de dados dinamica via useAdvogadas() (profiles.is_advogada).
                  value = legacy_key (juliana/liziane) quando disponivel — preserva compat
                  com os consumidores que ainda fazem string match. Para advogadas novas,
                  gravamos o apelido normalizado.
                  Fallback hardcoded para o caso da query ainda nao ter respondido.
                */}
                {advogadas && advogadas.length > 0 ? (
                  advogadas.map((a) => (
                    <SelectItem key={a.id} value={a.legacy_key ?? a.apelido}>
                      {a.nome_completo}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="juliana">{advogadaLabels.juliana}</SelectItem>
                    <SelectItem value="liziane">{advogadaLabels.liziane}</SelectItem>
                  </>
                )}
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
