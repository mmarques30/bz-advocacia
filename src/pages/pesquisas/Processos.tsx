import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scale, Calendar, Building2, FileText, Activity, ChevronDown, ChevronUp, Info, ShieldCheck } from "lucide-react";
import { ConsultaProcessoForm } from "@/components/pesquisas/ConsultaProcessoForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useConsultaProcesso } from "@/hooks/useConsultaProcesso";
import type { ConsultaProcessoResponse } from "@/types/pesquisas";

function ResultadoConsulta({ data }: { data: ConsultaProcessoResponse }) {
  const [movimentosOpen, setMovimentosOpen] = useState(false);
  const { processo, metadados } = data;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não informada";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        Resultado da Consulta
      </h3>

      {/* Dados principais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-mono">
                {processo.numeroProcesso}
              </CardTitle>
              <CardDescription>{processo.classe}</CardDescription>
            </div>
            <Badge variant="outline">{processo.tribunalSigla}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tribunal</span>
              <p className="font-medium">{processo.tribunal}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Grau</span>
              <p className="font-medium">{processo.grau}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Formato</span>
              <p className="font-medium">{processo.formato}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Sigilo</span>
              <p className="font-medium">
                {processo.nivelSigilo === 0 ? "Público" : `Nível ${processo.nivelSigilo}`}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-muted-foreground">Data de Ajuizamento</span>
                <p className="font-medium">{formatDateShort(processo.dataAjuizamento)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-muted-foreground">Última Atualização</span>
                <p className="font-medium">{formatDate(processo.dataHoraUltimaAtualizacao)}</p>
              </div>
            </div>
          </div>

          {processo.orgaoJulgador && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-muted-foreground text-sm">Órgão Julgador</span>
                  <p className="font-medium">{processo.orgaoJulgador.nome}</p>
                  {processo.orgaoJulgador.codigo && (
                    <p className="text-xs text-muted-foreground">Código: {processo.orgaoJulgador.codigo}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assuntos */}
      {processo.assuntos && processo.assuntos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assuntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {processo.assuntos.map((assunto, index) => (
                <Badge key={index} variant="secondary">
                  {assunto.nome}
                  {assunto.codigo && <span className="ml-1 opacity-60">({assunto.codigo})</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movimentações */}
      {processo.movimentos && processo.movimentos.length > 0 && (
        <Card>
          <Collapsible open={movimentosOpen} onOpenChange={setMovimentosOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Movimentações ({processo.movimentos.length})
                  </CardTitle>
                  {movimentosOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {processo.movimentos.map((mov, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-2 border-b last:border-0"
                    >
                      <div className="text-xs text-muted-foreground whitespace-nowrap min-w-[80px]">
                        {formatDateShort(mov.dataHora)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{mov.nome}</p>
                        {mov.codigo && (
                          <p className="text-xs text-muted-foreground">Código: {mov.codigo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Metadados da consulta */}
      <div className="text-xs text-muted-foreground text-center">
        Consulta realizada em {formatDate(metadados.consultadoEm)} | 
        ID: {metadados.idConsulta.slice(0, 8)}... | 
        Fonte: API Datajud (CNJ)
      </div>
    </div>
  );
}

export default function PesquisasProcessos() {
  const { data, reset } = useConsultaProcesso();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Consulta de Processos Judiciais</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px]">
                <p className="font-medium mb-1">API Datajud (CNJ)</p>
                <ul className="text-xs space-y-0.5">
                  <li>• 120 requisições por minuto</li>
                  <li>• Dados podem ter 1-7 dias de atraso</li>
                  <li>• Processos sigilosos não retornam dados</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px]">
                <p className="font-medium mb-1">Conformidade LGPD</p>
                <p className="text-xs">
                  Todas as consultas são registradas com motivo e justificativa para fins de auditoria.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-muted-foreground">
          Consulte informações públicas de processos via API oficial do CNJ (Datajud)
        </p>
      </div>

      <div className="max-w-4xl">
        <ConsultaProcessoForm onSuccess={() => {}} />
        
        {data && <ResultadoConsulta data={data} />}
      </div>
    </div>
  );
}
