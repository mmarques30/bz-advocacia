import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Cake,
  Send,
  UserPlus,
  ArrowRight,
  MessageSquare,
  Paperclip,
  FileText,
  CheckCircle,
  Edit,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAniversariantes } from "@/hooks/useAniversariantes";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { getIniciais } from "@/lib/iniciais";

const activityIcons: Record<string, any> = {
  lead_criado: UserPlus,
  status_mudou: ArrowRight,
  nota_adicionada: MessageSquare,
  documento_anexado: Paperclip,
  proposta_enviada: FileText,
  convertido_cliente: CheckCircle,
  editado: Edit,
};

function useAtividadesRecentes() {
  return useQuery({
    queryKey: ["atividades-recentes-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, tipo, descricao, created_at, entidade_id")
        .eq("entidade_tipo", "lead")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function ClientesEventosTab() {
  const { data: aniversariantes, isLoading: loadingAniv } = useAniversariantes();
  const { data: atividades, isLoading: loadingAtiv } = useAtividadesRecentes();

  const hoje = new Date();
  const mesNome = format(hoje, "MMMM", { locale: ptBR });
  const aniversariantesHoje = (aniversariantes || []).filter((a) => a.isHoje);
  const aniversariantesProximos = (aniversariantes || []).filter((a) => !a.isHoje);

  const navigate = useNavigate();
  async function handleEnviarParabens(a: { id: string; nome: string; telefone: string; lead_geral_id?: string | null }) {
    const msg = `Olá ${a.nome.split(" ")[0]}! Desejamos um feliz aniversário! Que este novo ciclo traga muitas realizações. Abraços da equipe B&Z Advocacia!`;

    // Garante que existe lead_geral pra o contact_submissions (cria sob
    // demanda se nao houver). RPC retorna o lead_geral_id final.
    let leadGeralId = a.lead_geral_id;
    if (!leadGeralId) {
      const { data, error } = await supabase.rpc("garantir_lead_geral_para_contact", {
        p_contact_submission_id: a.id,
      });
      if (error || !data) {
        toast({
          title: "Não consegui abrir o atendimento",
          description: error?.message ?? "Tente abrir manualmente.",
          variant: "destructive",
        });
        return;
      }
      leadGeralId = data as string;
    }
    navigate(`/dashboard/atendimento?lead=${encodeURIComponent(leadGeralId)}&msg=${encodeURIComponent(msg)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Aniversariantes do mês */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">
            Aniversariantes de {mesNome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAniv ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (aniversariantes || []).length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Cake className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhum aniversariante este mês</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="space-y-2">
                {/* Aniversariantes de hoje */}
                {aniversariantesHoje.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg p-3 flex items-center justify-between gap-2"
                    style={{ backgroundColor: "#EAF3DE" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Cake className="w-4 h-4 shrink-0" style={{ color: "#3B6D11" }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#3B6D11" }}>
                          {a.nome}
                        </p>
                        <p className="text-[10px]" style={{ color: "#3B6D11" }}>
                          Aniversário hoje
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 shrink-0"
                      onClick={() => handleEnviarParabens(a)}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Enviar parabéns
                    </Button>
                  </div>
                ))}

                {/* Próximos */}
                {aniversariantesProximos.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden">
                      {getIniciais(a.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.nome}</p>
                      <p className="text-[10px] text-muted-foreground">dia {a.dia}</p>
                    </div>
                    {a.diasAte <= 7 ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#E6F1FB", color: "#378ADD" }}
                      >
                        em {a.diasAte}d
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">dia {a.dia}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Atividades recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAtiv ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !atividades || atividades.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma atividade registrada</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {atividades.map((atv, i) => {
                  const Icon = activityIcons[atv.tipo] || Edit;
                  return (
                    <div
                      key={atv.id}
                      className={`flex gap-3 ${i !== atividades.length - 1 ? "mb-4" : ""}`}
                    >
                      <div className="relative z-10">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex-1 pt-0.5 min-w-0">
                        <p className="text-xs font-medium truncate">{atv.descricao}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(atv.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
