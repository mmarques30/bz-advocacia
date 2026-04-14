import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, CalendarRange, Calendar, Copy, Check, Loader2, ChevronDown, Sparkles, Bug, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Atualizacao {
  id: string;
  periodo: string;
  data_inicio: string;
  data_fim: string;
  conteudo: string;
  created_at: string;
}

interface Melhoria {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  data_implementacao: string;
}

export default function Atualizacoes() {
  const [loading, setLoading] = useState(false);
  const [loadingPeriodo, setLoadingPeriodo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [historico, setHistorico] = useState<Atualizacao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [melhorias, setMelhorias] = useState<Melhoria[]>([]);
  const [loadingMelhorias, setLoadingMelhorias] = useState(true);

  const fetchHistorico = async () => {
    setLoadingHistorico(true);
    const { data, error } = await supabase
      .from("atualizacoes_sistema")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setHistorico(data as Atualizacao[]);
    }
    setLoadingHistorico(false);
  };

  const fetchMelhorias = async () => {
    setLoadingMelhorias(true);
    const { data, error } = await supabase
      .from("melhorias_registro")
      .select("*")
      .order("data_implementacao", { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setMelhorias(data as Melhoria[]);
    }
    setLoadingMelhorias(false);
  };

  useEffect(() => {
    fetchHistorico();
    fetchMelhorias();
  }, []);

  const gerarAtualizacao = async (periodo: string) => {
    setLoading(true);
    setLoadingPeriodo(periodo);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-updates", {
        body: { periodo },
      });

      if (error) throw error;
      
      setResultado(data.conteudo);
      fetchHistorico();
      toast({ title: "Análise gerada com sucesso!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao gerar análise", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingPeriodo(null);
    }
  };

  const copiarTexto = async (texto: string) => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    toast({ title: "Texto copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const periodoLabel = (p: string) => {
    if (p === "dia") return "Hoje";
    if (p === "semana") return "Semana";
    return "Mês";
  };

  const tipoIcon = (tipo: string) => {
    if (tipo === "correcao") return <Bug className="h-4 w-4 text-orange-500" />;
    if (tipo === "nova_funcionalidade") return <Star className="h-4 w-4 text-green-500" />;
    return <Zap className="h-4 w-4 text-blue-500" />;
  };

  const tipoLabel = (tipo: string) => {
    if (tipo === "correcao") return "Correção";
    if (tipo === "nova_funcionalidade") return "Nova funcionalidade";
    return "Melhoria";
  };

  const toggleItem = (id: string) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Atualizações do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Gere relatórios de melhorias e envie para seus clientes
        </p>
      </div>

      <Tabs defaultValue="gerar">
        <TabsList>
          <TabsTrigger value="gerar">Gerar Atualização</TabsTrigger>
          <TabsTrigger value="melhorias">Melhorias Registradas ({melhorias.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Analisar Melhorias
              </CardTitle>
              <CardDescription>
                Selecione o período para gerar um texto profissional com as melhorias registradas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => gerarAtualizacao("dia")} disabled={loading} variant="outline" className="gap-2">
                  {loadingPeriodo === "dia" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                  Hoje
                </Button>
                <Button onClick={() => gerarAtualizacao("semana")} disabled={loading} variant="outline" className="gap-2">
                  {loadingPeriodo === "semana" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
                  Última Semana
                </Button>
                <Button onClick={() => gerarAtualizacao("mes")} disabled={loading} variant="outline" className="gap-2">
                  {loadingPeriodo === "mes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                  Último Mês
                </Button>
              </div>
            </CardContent>
          </Card>

          {resultado && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Resultado da Análise</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copiarTexto(resultado)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 rounded-lg p-4 border">
                  {resultado}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="melhorias" className="space-y-4">
          {loadingMelhorias ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : melhorias.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma melhoria registrada ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {melhorias.map((m) => (
                <Card key={m.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {tipoIcon(m.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{m.titulo}</span>
                          <Badge variant="outline" className="text-xs">{tipoLabel(m.tipo)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(m.data_implementacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historico.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma análise gerada ainda. Use a aba "Gerar Atualização" para começar.
              </CardContent>
            </Card>
          ) : (
            historico.map((item) => (
              <Collapsible key={item.id} open={openItems.includes(item.id)} onOpenChange={() => toggleItem(item.id)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{periodoLabel(item.periodo)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openItems.includes(item.id) ? "rotate-180" : ""}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="flex justify-end mb-2">
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => copiarTexto(item.conteudo)}>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </Button>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 rounded-lg p-4 border">
                        {item.conteudo}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
