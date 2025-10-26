import { useLeadActivities } from "@/hooks/useActivities";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  ArrowRight, 
  MessageSquare, 
  Paperclip, 
  FileText, 
  CheckCircle, 
  Edit,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadTimelineProps {
  leadId: string;
}

const getActivityIcon = (tipo: string) => {
  const icons: Record<string, any> = {
    lead_criado: UserPlus,
    status_mudou: ArrowRight,
    nota_adicionada: MessageSquare,
    documento_anexado: Paperclip,
    proposta_enviada: FileText,
    convertido_cliente: CheckCircle,
    editado: Edit,
  };
  
  const Icon = icons[tipo] || Edit;
  return <Icon className="h-5 w-5" />;
};

export function LeadTimeline({ leadId }: LeadTimelineProps) {
  const { data: atividades, isLoading } = useLeadActivities(leadId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!atividades || atividades.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma atividade registrada ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        {atividades.map((atividade, index) => (
          <div key={atividade.id} className={`flex gap-4 ${index !== atividades.length - 1 ? 'mb-6' : ''}`}>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getActivityIcon(atividade.tipo)}
              </div>
            </div>
            
            <div className="flex-1 pt-1">
              <p className="font-medium text-sm">{atividade.descricao}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(atividade.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
