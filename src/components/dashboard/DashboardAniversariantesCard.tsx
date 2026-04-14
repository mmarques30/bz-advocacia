import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, ArrowRight, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Aniversariante } from "@/hooks/useDashboardVisual";
import { openWhatsAppLink } from "@/lib/whatsappUtils";

interface Props {
  aniversariantes: Aniversariante[];
  loading?: boolean;
}

export function DashboardAniversariantesCard({ aniversariantes, loading }: Props) {
  const navigate = useNavigate();
  const hoje = new Date();
  const mesNome = format(hoje, "MMMM", { locale: ptBR });
  const aniversariantesHoje = aniversariantes.filter((a) => a.isHoje);

  function getIniciais(nome: string) {
    const parts = nome.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : nome.substring(0, 2).toUpperCase();
  }

  function handleEnviarParabens(a: Aniversariante) {
    const msg = `Olá ${a.nome.split(" ")[0]}! 🎂 Desejamos um feliz aniversário! Que este novo ciclo traga muitas realizações. Abraços da equipe B&Z Advocacia!`;
    openWhatsAppLink(a.telefone, msg);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Aniversariantes do mês</CardTitle>
          <button
            onClick={() => navigate("/dashboard/clientes")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver clientes <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Banner hoje */}
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

        {/* Lista */}
        {aniversariantes.length > 0 ? (
          <div className="space-y-2">
            {aniversariantes.filter(a => !a.isHoje).map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
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
                    {a.diasAte}d
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">dia {a.dia}</span>
                )}
              </div>
            ))}
          </div>
        ) : aniversariantesHoje.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <Cake className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">Nenhum aniversariante este mês</p>
          </div>
        ) : null}

        {/* Footer */}
        {aniversariantes.length > 0 && (
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            {aniversariantes.length} aniversariante{aniversariantes.length > 1 ? "s" : ""} em {mesNome}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
