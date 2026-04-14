import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Search, MapPin, Users, Briefcase, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useConsultaCNPJ, ConsultaCNPJResponse } from "@/hooks/useConsultaBrasilAPI";
import { toast } from "@/lib/toast";

const motivosConsulta = [
  "Análise processual",
  "Diligência investigativa",
  "Verificação cadastral",
  "Análise de crédito",
  "Contrato/Acordo",
  "Outro",
];

export default function ConsultaCNPJForm() {
  const [cnpj, setCnpj] = useState("");
  const [motivo, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [resultado, setResultado] = useState<ConsultaCNPJResponse | null>(null);

  const { mutate: consultarCNPJ, isPending } = useConsultaCNPJ();

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnpj || !motivo || !justificativa) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      toast.error("CNPJ inválido", {
        description: "O CNPJ deve ter 14 dígitos",
      });
      return;
    }

    consultarCNPJ(
      {
        tipo: "cnpj",
        valor: cnpjLimpo,
        motivo,
        justificativa,
      },
      {
        onSuccess: (data) => {
          setResultado(data);
          toast.success("Consulta realizada com sucesso!");
        },
      }
    );
  };

  const getSituacaoBadge = (situacao: string) => {
    const situacaoUpper = situacao?.toUpperCase() || "";
    if (situacaoUpper === "ATIVA") {
      return (
        <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          ATIVA
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        {situacao || "DESCONHECIDA"}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Consulta de CNPJ
          </CardTitle>
          <CardDescription>
            Consulte dados cadastrais de empresas via BrasilAPI (gratuito)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo da Consulta *</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger id="motivo">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosConsulta.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                placeholder="Descreva brevemente o motivo desta consulta..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={2}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Consultar CNPJ
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultado da Consulta */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado da Consulta</span>
              {getSituacaoBadge(resultado.dados.situacaoCadastral)}
            </CardTitle>
            <CardDescription>
              Consultado em {new Date(resultado.metadados.consultadoEm).toLocaleString("pt-BR")} via {resultado.metadados.fonte}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações Principais */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="font-medium">{resultado.dados.razaoSocial}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p className="font-medium">{resultado.dados.nomeFantasia || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium font-mono">{formatCNPJ(resultado.dados.cnpj)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Abertura</p>
                <p className="font-medium">
                  {resultado.dados.dataAbertura
                    ? new Date(resultado.dados.dataAbertura).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Natureza Jurídica</p>
                <p className="font-medium">{resultado.dados.naturezaJuridica || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Porte</p>
                <p className="font-medium">{resultado.dados.porte || "-"}</p>
              </div>
              {resultado.dados.capitalSocial > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Capital Social</p>
                  <p className="font-medium">{formatCurrency(resultado.dados.capitalSocial)}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Endereço */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4" />
                Endereço
              </h4>
              <p className="text-sm">
                {resultado.dados.endereco.logradouro}, {resultado.dados.endereco.numero}
                {resultado.dados.endereco.complemento && ` - ${resultado.dados.endereco.complemento}`}
              </p>
              <p className="text-sm">
                {resultado.dados.endereco.bairro} - {resultado.dados.endereco.municipio}/{resultado.dados.endereco.uf}
              </p>
              <p className="text-sm text-muted-foreground">CEP: {resultado.dados.endereco.cep}</p>
            </div>

            <Separator />

            {/* Atividade Principal */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4" />
                Atividade Principal
              </h4>
              <p className="text-sm">
                <span className="font-mono text-muted-foreground">{resultado.dados.atividadePrincipal.codigo}</span>
                {" - "}
                {resultado.dados.atividadePrincipal.descricao}
              </p>
            </div>

            {/* Atividades Secundárias */}
            {resultado.dados.atividadesSecundarias.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Atividades Secundárias</h4>
                  <ul className="space-y-1 text-sm">
                    {resultado.dados.atividadesSecundarias.slice(0, 5).map((atividade, index) => (
                      <li key={index}>
                        <span className="font-mono text-muted-foreground">{atividade.codigo}</span>
                        {" - "}
                        {atividade.descricao}
                      </li>
                    ))}
                    {resultado.dados.atividadesSecundarias.length > 5 && (
                      <li className="text-muted-foreground">
                        + {resultado.dados.atividadesSecundarias.length - 5} atividades
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {/* Quadro Societário */}
            {resultado.dados.qsa.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    Quadro Societário (QSA)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {resultado.dados.qsa.map((socio, index) => (
                      <li key={index} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{socio.nome}</p>
                          <p className="text-muted-foreground">{socio.qualificacao}</p>
                        </div>
                        {socio.dataEntrada && (
                          <span className="text-xs text-muted-foreground">
                            Desde {new Date(socio.dataEntrada).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Opções Tributárias */}
            <Separator />
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Simples Nacional:</span>
                {resultado.dados.simplesNacional.optante ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Optante</Badge>
                ) : (
                  <Badge variant="secondary">Não Optante</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">MEI:</span>
                {resultado.dados.mei.optante ? (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">Sim</Badge>
                ) : (
                  <Badge variant="secondary">Não</Badge>
                )}
              </div>
            </div>

            {/* Contato */}
            {(resultado.dados.contato.telefone || resultado.dados.contato.email) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Contato</h4>
                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    {resultado.dados.contato.telefone && (
                      <div>
                        <span className="text-muted-foreground">Telefone: </span>
                        {resultado.dados.contato.telefone}
                      </div>
                    )}
                    {resultado.dados.contato.email && (
                      <div>
                        <span className="text-muted-foreground">E-mail: </span>
                        {resultado.dados.contato.email}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
