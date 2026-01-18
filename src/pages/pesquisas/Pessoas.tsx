import { useState } from "react";
import { ConsultaPessoaForm } from "@/components/pesquisas/ConsultaPessoaForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileDown, MapPin, Phone, Mail, AlertTriangle, User } from "lucide-react";
import type { ConsultaPessoaResponse } from "@/types/pesquisas";

export default function Pessoas() {
  const [resultado, setResultado] = useState<ConsultaPessoaResponse | null>(null);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Localizar Pessoa</h1>
        <p className="text-muted-foreground mt-2">
          Busque endereços, telefones e outras informações de pessoas físicas ou jurídicas
        </p>
      </div>

      {/* Formulário ocupa largura total */}
      <ConsultaPessoaForm onResultado={setResultado} />

      {/* Resultado aparece abaixo */}
      {resultado && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resultado da Consulta
            </CardTitle>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identificação */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Identificação</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{resultado.identificacao.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{resultado.identificacao.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{resultado.identificacao.dataNascimento} ({resultado.identificacao.idade} anos)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Situação CPF</p>
                  <Badge variant={resultado.identificacao.situacaoCPF === "Regular" ? "default" : "destructive"}>
                    {resultado.identificacao.situacaoCPF}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Naturalidade</p>
                  <p className="font-medium">{resultado.identificacao.naturalidade}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereços */}
            {resultado.enderecos && resultado.enderecos.length > 0 && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereços Conhecidos ({resultado.enderecos.length})
                  </h3>
                  <div className="space-y-3">
                    {resultado.enderecos.map((endereco, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {endereco.logradouro}, {endereco.numero}
                              {endereco.complemento && ` - ${endereco.complemento}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {endereco.bairro} - {endereco.cidade}/{endereco.uf}
                            </p>
                            <p className="text-sm text-muted-foreground">CEP: {endereco.cep}</p>
                          </div>
                          <Badge variant="outline">{endereco.tipo}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Última atualização: {endereco.ultimaAtualizacao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Telefones */}
            {resultado.telefones && resultado.telefones.length > 0 && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefones ({resultado.telefones.length})
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {resultado.telefones.map((telefone, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{telefone.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            {telefone.tipo} {telefone.operadora && `- ${telefone.operadora}`}
                          </p>
                        </div>
                        <Badge variant={telefone.status === "ativo" ? "default" : "secondary"} className="ml-auto">
                          {telefone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* E-mails */}
            {resultado.emails && resultado.emails.length > 0 && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mails ({resultado.emails.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resultado.emails.map((email, index) => (
                      <Badge key={index} variant="outline">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Situação Financeira */}
            {resultado.situacaoFinanceira && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Situação Financeira
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Restrições</p>
                      <Badge variant={resultado.situacaoFinanceira.possuiRestricoes ? "destructive" : "default"}>
                        {resultado.situacaoFinanceira.possuiRestricoes ? "Possui restrições" : "Sem restrições"}
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Protestos</p>
                      <p className="font-medium text-lg">{resultado.situacaoFinanceira.protestos}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-medium text-lg">
                        {resultado.situacaoFinanceira.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadados */}
            <div className="text-sm text-muted-foreground">
              <p>ID da Consulta: {resultado.metadados.idConsulta}</p>
              <p>Custo: R$ {resultado.metadados.custo.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
