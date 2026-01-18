import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scale, Calendar, Building2, FileText, Activity, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConsultaProcessoForm } from "@/components/pesquisas/ConsultaProcessoForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consulta de Processos Judiciais</h1>
          <p className="text-muted-foreground">
            Consulte informações públicas de processos via API oficial do CNJ (Datajud)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConsultaProcessoForm onSuccess={() => {}} />
            
            {data && <ResultadoConsulta data={data} />}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobre a API Datajud</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  A API Pública do Datajud é mantida pelo CNJ e fornece acesso 
                  aos metadados de processos judiciais de todos os tribunais brasileiros.
                </p>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Limitações:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>120 requisições por minuto</li>
                    <li>Dados podem ter 1-7 dias de atraso</li>
                    <li>Processos sigilosos não retornam dados</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Conformidade LGPD
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Todas as consultas são registradas com motivo e justificativa 
                  para fins de auditoria e conformidade com a Lei Geral de Proteção de Dados.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
