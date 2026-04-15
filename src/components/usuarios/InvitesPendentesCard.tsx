import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, X, Clock } from "lucide-react";
import { useInvitesPendentes, useCancelInvite } from "@/hooks/useUsuarios";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export function InvitesPendentesCard() {
  const { data: invites, isLoading } = useInvitesPendentes();
  const { mutate: cancelInvite } = useCancelInvite();

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convites Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invites || invites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convites Pendentes</CardTitle>
          <CardDescription>Nenhum convite pendente no momento</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Convites Pendentes ({invites.length})
        </CardTitle>
        <CardDescription>Convites enviados aguardando aceitação</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invite.email}</span>
                  <Badge variant="outline">{invite.role}</Badge>
                  {isExpired(invite.expires_at) && (
                    <Badge variant="destructive">Expirado</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Enviado por {invite.invited_by_name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(invite.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Cancelar convite de ${invite.email}`}
                onClick={() => cancelInvite(invite.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
