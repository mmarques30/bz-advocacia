import { Link } from "react-router-dom";
import { 
  ClipboardList, 
  DollarSign, 
  Scale, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPendencias } from "@/hooks/useUserPendencias";
import { cn } from "@/lib/utils";

interface UserPendenciasCardsProps {
  data?: UserPendencias;
  loading?: boolean;
}

interface PendenciaCardProps {
  titulo: string;
  icone: React.ElementType;
  corBorda: string;
  corIcone: string;
  corBg: string;
  total: number;
  subtitulo: string;
  detalhes: Array<{ 
    label: string; 
    valor: number; 
    icone?: React.ElementType;
    corTexto?: string;
  }>;
  link: string;
  linkLabel: string;
}

function PendenciaCard({ 
  titulo, 
  icone: Icone, 
  corBorda,
  corIcone,
  corBg,
  total, 
  subtitulo, 
  detalhes, 
  link, 
  linkLabel 
}: PendenciaCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1",
      "border-l-4",
      corBorda
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", corBg)}>
            <Icone className={cn("h-5 w-5", corIcone)} />
          </div>
          <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-4xl font-bold tracking-tight">{total}</p>
          <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
        </div>
        
        {detalhes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detalhes.map((d, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className={cn(
                  "font-medium gap-1.5 py-1 px-2.5",
                  d.corTexto
                )}
              >
                {d.icone && <d.icone className="h-3 w-3" />}
                {d.label}: {d.valor}
              </Badge>
            ))}
          </div>
        )}
        
        <Link 
          to={link} 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline group"
        >
          {linkLabel} 
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardContent>
    </Card>
  );
}

function PendenciaCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Skeleton className="h-10 w-16 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

export function UserPendenciasCards({ data, loading }: UserPendenciasCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PendenciaCardSkeleton />
        <PendenciaCardSkeleton />
        <PendenciaCardSkeleton />
      </div>
    );
  }

  if (!data) return null;

  const totalPendencias = 
    data.demandas.total + 
    data.pagamentos.parcelasAtrasadas + 
    data.pagamentos.parcelasProximas + 
    data.processos.total;

  if (totalPendencias === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Suas Pendências</h2>
        <Badge variant="outline" className="font-medium">
          {totalPendencias} {totalPendencias === 1 ? 'item' : 'itens'}
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PendenciaCard
          titulo="Tarefas Pendentes"
          icone={ClipboardList}
          corBorda="border-l-orange-500"
          corIcone="text-orange-600"
          corBg="bg-orange-100"
          total={data.demandas.total}
          subtitulo="tarefas aguardando ação"
          detalhes={[
            ...(data.demandas.atrasadas > 0 ? [{
              label: "Atrasadas",
              valor: data.demandas.atrasadas,
              icone: AlertTriangle,
              corTexto: "text-destructive bg-destructive/10"
            }] : []),
            ...(data.demandas.urgentes > 0 ? [{
              label: "Urgentes",
              valor: data.demandas.urgentes,
              icone: Clock,
              corTexto: "text-amber-700 bg-amber-100"
            }] : [])
          ]}
          link="/dashboard/processos/demandas"
          linkLabel="Ver tarefas"
        />

        <PendenciaCard
          titulo="Pagamentos"
          icone={DollarSign}
          corBorda="border-l-emerald-500"
          corIcone="text-emerald-600"
          corBg="bg-emerald-100"
          total={data.pagamentos.parcelasAtrasadas + data.pagamentos.parcelasProximas}
          subtitulo="parcelas pendentes"
          detalhes={[
            ...(data.pagamentos.parcelasAtrasadas > 0 ? [{
              label: "Atrasadas",
              valor: data.pagamentos.parcelasAtrasadas,
              icone: AlertTriangle,
              corTexto: "text-destructive bg-destructive/10"
            }] : []),
            ...(data.pagamentos.parcelasProximas > 0 ? [{
              label: "Próx. 7 dias",
              valor: data.pagamentos.parcelasProximas,
              icone: Clock,
              corTexto: "text-blue-700 bg-blue-100"
            }] : [])
          ]}
          link="/dashboard/financeiro/pagamentos"
          linkLabel="Ver pagamentos"
        />

        <PendenciaCard
          titulo="Processos em Atraso"
          icone={Scale}
          corBorda="border-l-red-500"
          corIcone="text-red-600"
          corBg="bg-red-100"
          total={data.processos.total}
          subtitulo="sem atualização há +30 dias"
          detalhes={[
            ...(data.processos.total > 0 ? [{
              label: "Precisam atenção",
              valor: data.processos.total,
              icone: AlertTriangle,
              corTexto: "text-destructive bg-destructive/10"
            }] : [])
          ]}
          link="/dashboard/processos"
          linkLabel="Ver processos"
        />
      </div>
    </div>
  );
}
