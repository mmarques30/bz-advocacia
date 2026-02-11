import { Link } from "react-router-dom";
import {
  Lightbulb,
  ClipboardList,
  Scale,
  UserX,
  Timer,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PropostaAcao } from "@/hooks/useDashboardCompleto";

interface PropostasInteligentesProps {
  propostas: PropostaAcao[];
  loading?: boolean;
}

const ICONE_MAP: Record<string, React.ElementType> = {
  ClipboardList,
  Scale,
  UserX,
  Timer,
};

const SEVERIDADE_STYLES: Record<string, { badge: string; border: string; bg: string }> = {
  error: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    border: "border-l-destructive",
    bg: "bg-destructive/5",
  },
  warning: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-l-amber-500",
    bg: "bg-amber-50",
  },
  info: {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    border: "border-l-blue-500",
    bg: "bg-blue-50",
  },
};

export function PropostasInteligentes({ propostas, loading }: PropostasInteligentesProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (propostas.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Sugestões de Ação</CardTitle>
          <Badge variant="outline" className="ml-auto font-medium">
            {propostas.length} {propostas.length === 1 ? "item" : "itens"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {propostas.map((proposta) => {
              const Icone = ICONE_MAP[proposta.icone] || Lightbulb;
              const styles = SEVERIDADE_STYLES[proposta.severidade] || SEVERIDADE_STYLES.info;

              return (
                <Link
                  key={proposta.id}
                  to={proposta.link}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all hover:shadow-sm",
                    styles.border,
                    styles.bg,
                    "hover:brightness-95"
                  )}
                >
                  <Icone className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{proposta.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{proposta.descricao}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                </Link>
              );
            })}
          </div>
      </CardContent>
    </Card>
  );
}
