import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConsultaPessoaForm } from "@/components/pesquisas/ConsultaPessoaForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, Phone, Mail } from "lucide-react";
import type { ConsultaPessoaResponse } from "@/types/pesquisas";

export default function Pessoas() {
  const [resultado, setResultado] = useState<ConsultaPessoaResponse | null>(null);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Localizar Pessoa</h1>
        <p className="text-muted-foreground mt-2">
          Busque endereços, telefones e outras informações de pessoas físicas
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <ConsultaPessoaForm onResultado={setResultado} />
        </div>

        {resultado && (
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resultado da Consulta</CardTitle>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Identificação</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span>{resultado.identificacao.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="font-mono">{resultado.identificacao.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Nascimento:</span>
                      <span>{resultado.identificacao.dataNascimento} ({resultado.identificacao.idade} anos)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Situação CPF:</span>
                      <Badge variant={resultado.identificacao.situacaoCPF === 'REGULAR' ? 'default' : 'destructive'}>
                        {resultado.identificacao.situacaoCPF}
                      </Badge>
                    </div>
                  </div>
                </div>

                {resultado.enderecos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereços Conhecidos ({resultado.enderecos.length})
                    </h3>
                    <Separator className="mb-3" />
                    <div className="space-y-3">
                      {resultado.enderecos.map((endereco, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                          <div className="font-medium">
                            {endereco.logradouro}, {endereco.numero}
                            {endereco.complemento && ` - ${endereco.complemento}`}
                          </div>
                          <div className="text-muted-foreground">
                            {endereco.bairro} - {endereco.cidade}/{endereco.uf}
                          </div>
                          <div className="text-muted-foreground">CEP: {endereco.cep}</div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{endereco.tipo}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Atualizado: {endereco.ultimaAtualizacao}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.telefones.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefones ({resultado.telefones.length})
                    </h3>
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      {resultado.telefones.map((telefone, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span className="font-mono">{telefone.numero}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline">{telefone.tipo}</Badge>
                            {telefone.operadora && (
                              <Badge variant="secondary">{telefone.operadora}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.emails.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mails ({resultado.emails.length})
                    </h3>
                    <Separator className="mb-3" />
                    <div className="space-y-1">
                      {resultado.emails.map((email, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded font-mono">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.situacaoFinanceira && (
                  <div>
                    <h3 className="font-semibold mb-2">Situação Financeira</h3>
                    <Separator className="mb-3" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Possui restrições:</span>
                        <Badge variant={resultado.situacaoFinanceira.possuiRestricoes ? 'destructive' : 'default'}>
                          {resultado.situacaoFinanceira.possuiRestricoes ? 'SIM' : 'NÃO'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Protestos:</span>
                        <span>{resultado.situacaoFinanceira.protestos} ocorrências</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor total:</span>
                        <span className="font-semibold">R$ {resultado.situacaoFinanceira.valorTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <p>ID da Consulta: {resultado.metadados.idConsulta}</p>
                  <p>Custo: R$ {resultado.metadados.custo.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
