import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWhatsAppHistorico } from "@/hooks/useWhatsAppHistorico";
import { NotificacaoStatus } from "@/types/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Send, Check, CheckCheck } from "lucide-react";

export default function Historico() {
  const [status, setStatus] = useState<NotificacaoStatus | "todos">("todos");
  const [busca, setBusca] = useState("");

  const { data: historico = [], isLoading } = useWhatsAppHistorico({
    status: status === "todos" ? undefined : status,
  });

  const filteredHistorico = historico.filter(h => {
    if (!busca) return true;
    return (
      h.destinatario_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      h.destinatario_telefone.includes(busca)
    );
  });

  const getStatusBadge = (status: NotificacaoStatus) => {
    const variants = {
      pendente: { variant: "secondary" as const, icon: Clock, label: "Pendente" },
      enviado: { variant: "default" as const, icon: Send, label: "Enviado" },
      entregue: { variant: "default" as const, icon: Check, label: "Entregue" },
      lido: { variant: "default" as const, icon: CheckCheck, label: "Lido" },
      falhou: { variant: "destructive" as const, icon: XCircle, label: "Falhou" },
      aprovado: { variant: "default" as const, icon: CheckCircle, label: "Aprovado" },
      rejeitado: { variant: "destructive" as const, icon: XCircle, label: "Rejeitado" },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: historico.length,
    entregues: historico.filter(h => h.status === 'entregue' || h.status === 'lido').length,
    lidos: historico.filter(h => h.status === 'lido').length,
    falhas: historico.filter(h => h.status === 'falhou').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Histórico de Notificações</h1>
        <p className="text-muted-foreground">
          Visualize todas as notificações enviadas via WhatsApp
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entregues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.entregues / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lidos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.lidos / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.falhas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.falhas / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por cliente ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="lido">Lido</SelectItem>
            <SelectItem value="falhou">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : filteredHistorico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma notificação encontrada
            </div>
          ) : (
            <div className="divide-y">
              {filteredHistorico.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.destinatario_nome || 'Cliente'}</span>
                        <span className="text-sm text-muted-foreground">{item.destinatario_telefone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.mensagem}
                      </p>
                      {item.erro_mensagem && (
                        <p className="text-sm text-destructive">
                          Erro: {item.erro_mensagem}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {item.lido_em && (
                          <span>
                            Lido: {format(new Date(item.lido_em), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
