import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react";
import { useMetaConnection } from "@/hooks/useMetaConnection";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MetaAdsConnection() {
  const { connection, isLoading, isConnected, disconnect, sync, isSyncing, isDisconnecting } = useMetaConnection();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status da Conexão</CardTitle>
            <CardDescription>
              {isConnected ? "Sua conta Meta Ads está conectada" : "Conecte sua conta Meta Ads para começar"}
            </CardDescription>
          </div>
          {isConnected ? (
            <Badge variant="default" className="gap-2">
              <CheckCircle2 className="h-3 w-3" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-2">
              <AlertCircle className="h-3 w-3" />
              Não conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && connection ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conta:</span>
                <span className="font-medium">{connection.account_name || connection.account_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conectado em:</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(connection.conectado_em), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {connection.ultima_sincronizacao && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última sincronização:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(connection.ultima_sincronizacao), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync()}
                disabled={isSyncing}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disconnect(connection.id)}
                disabled={isDisconnecting}
              >
                <Unplug className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Button className="w-full" disabled>
              Conectar com Meta Ads
              <span className="ml-2 text-xs opacity-70">(Em breve)</span>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Configure as credenciais da API Meta para habilitar a conexão
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
