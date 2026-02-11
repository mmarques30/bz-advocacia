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
import { useState, useRef, useEffect } from "react";
import { Search, X, User } from "lucide-react";

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
  advogada_responsavel: 'juliana' | 'liziane';
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

  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [selectedClienteNome, setSelectedClienteNome] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const { data: clientes } = useQuery({
    queryKey: ['clientes-demandas', clienteSearch],
    queryFn: async () => {
      const query = supabase
        .from('contact_submissions')
        .select('id, nome_completo')
        .eq('estagio', 'fechado')
        .order('nome_completo')
        .limit(20);
      if (clienteSearch.length >= 2) {
        query.ilike('nome_completo', `%${clienteSearch}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: clienteSearch.length >= 2,
  });

  const { data: processos } = useQuery({
    queryKey: ['processos-demandas-cliente', selectedClienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('id, numero_processo, tipo')
        .eq('lead_id', selectedClienteId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClienteId,
  });

  // Handle defaultProcessoId: pre-select client
  useEffect(() => {
    if (defaultProcessoId && open) {
      supabase
        .from('processos')
        .select('id, lead_id, numero_processo, tipo')
        .eq('id', defaultProcessoId)
        .single()
        .then(({ data }) => {
          if (data?.lead_id) {
            supabase
              .from('contact_submissions')
              .select('id, nome_completo')
              .eq('id', data.lead_id)
              .single()
              .then(({ data: cliente }) => {
                if (cliente) {
                  setSelectedClienteId(cliente.id);
                  setSelectedClienteNome(cliente.nome_completo);
                  setValue('processo_id', defaultProcessoId);
                }
              });
          }
        });
    }
  }, [defaultProcessoId, open, setValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectCliente = (id: string, nome: string) => {
    setSelectedClienteId(id);
    setSelectedClienteNome(nome);
    setClienteSearch('');
    setShowClienteDropdown(false);
    setValue('processo_id', '');
  };

  const handleClearCliente = () => {
    setSelectedClienteId(null);
    setSelectedClienteNome('');
    setClienteSearch('');
    setValue('processo_id', '');
  };

  const onSubmit = (data: FormData) => {
    createDemanda.mutate({
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      prioridade: data.prioridade,
      categoria: data.categoria,
      advogada_responsavel: data.advogada_responsavel,
      status: 'pendente',
      responsavel_id: data.responsavel_id === 'sem_responsavel' ? null : data.responsavel_id || null,
      processo_id: data.processo_id === 'sem_processo' ? null : data.processo_id || null,
      data_limite: data.data_limite || null,
      data_conclusao: null,
    }, {
      onSuccess: () => {
        reset();
        handleClearCliente();
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

          {/* Cliente search + Processo selection */}
          <div className="space-y-2">
            <Label>Cliente / Processo Relacionado</Label>
            {selectedClienteId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{selectedClienteNome}</span>
                  <button type="button" onClick={handleClearCliente} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Select onValueChange={(value) => setValue('processo_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_processo">Nenhum processo</SelectItem>
                    {processos?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.numero_processo || p.tipo}
                      </SelectItem>
                    ))}
                    {processos?.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        Nenhum processo encontrado para este cliente
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do cliente..."
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      setShowClienteDropdown(e.target.value.length >= 2);
                    }}
                    onFocus={() => {
                      if (clienteSearch.length >= 2) setShowClienteDropdown(true);
                    }}
                    className="pl-9"
                  />
                </div>
                {showClienteDropdown && clientes && clientes.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[200px] overflow-y-auto">
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCliente(c.id, c.nome_completo)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {c.nome_completo}
                      </button>
                    ))}
                  </div>
                )}
                {showClienteDropdown && clientes && clientes.length === 0 && clienteSearch.length >= 2 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-3 text-sm text-muted-foreground text-center">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Advogada Responsável *</Label>
            <Select onValueChange={(value) => setValue('advogada_responsavel', value as any)} defaultValue="juliana">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="juliana">Juliana</SelectItem>
                <SelectItem value="liziane">Liziane</SelectItem>
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
