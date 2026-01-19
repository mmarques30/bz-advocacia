import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search, Loader2, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import { useConsultaCPF, ConsultaCPFResponse } from "@/hooks/useConsultaCPF";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MOTIVOS_CONSULTA = [
  "Verificação cadastral",
  "Análise de crédito",
  "Processo judicial",
  "Due diligence",
  "Contratação",
  "Outro",
];

export const ConsultaCPFForm = () => {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [resultado, setResultado] = useState<ConsultaCPFResponse | null>(null);

  const { mutate: consultarCPF, isPending } = useConsultaCPF();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      setCpf(formatted);
    }
  };

  const formatDateForDisplay = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateForDisplay(e.target.value);
    if (formatted.length <= 10) {
      setDataNascimento(formatted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cpf || !dataNascimento || !motivo || !justificativa) {
      return;
    }

    consultarCPF(
      { cpf, dataNascimento, motivo, justificativa },
      {
        onSuccess: (data) => {
          setResultado(data);
        },
      }
    );
  };

  const getSituacaoBadge = (situacao: string) => {
    const situacaoLower = situacao.toLowerCase();
    if (situacaoLower.includes('regular')) {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Regular</Badge>;
    }
    if (situacaoLower.includes('pendente')) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="h-3 w-3 mr-1" /> Pendente</Badge>;
    }
    if (situacaoLower.includes('suspensa') || situacaoLower.includes('cancelada')) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {situacao}</Badge>;
    }
    return <Badge variant="secondary">{situacao}</Badge>;
  };

  const limparFormulario = () => {
    setCpf("");
    setDataNascimento("");
    setMotivo("");
    setJustificativa("");
    setResultado(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  disabled={isPending}
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <div className="relative">
                  <Input
                    id="dataNascimento"
                    placeholder="DD/MM/AAAA"
                    value={dataNascimento}
                    onChange={handleDateChange}
                    disabled={isPending}
                    maxLength={10}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Consulta *</Label>
              <Select value={motivo} onValueChange={setMotivo} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CONSULTA.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                placeholder="Descreva a justificativa para esta consulta..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                disabled={isPending}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending || !cpf || !dataNascimento || !motivo || !justificativa}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </>
                )}
              </Button>
              {resultado && (
                <Button type="button" variant="outline" onClick={limparFormulario}>
                  Nova Consulta
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {resultado && resultado.status === 'sucesso' && resultado.dados && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resultado da Consulta
              </span>
              {getSituacaoBadge(resultado.dados.situacaoCadastral)}
            </CardTitle>
            <CardDescription>
              Consultado em {new Date(resultado.metadados?.consultadoEm || '').toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{resultado.dados.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium font-mono">{formatCPF(resultado.dados.cpf)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{resultado.dados.dataNascimento}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Situação Cadastral</p>
                <p className="font-medium">{resultado.dados.situacaoCadastral}</p>
              </div>
              {resultado.dados.dataInscricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Inscrição</p>
                  <p className="font-medium">{resultado.dados.dataInscricao}</p>
                </div>
              )}
            </div>

            {resultado.dados.anoObito && (
              <>
                <Separator />
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Registro de óbito: {resultado.dados.anoObito}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>ID da Consulta: {resultado.metadados?.idConsulta}</p>
              <p>Fonte: {resultado.metadados?.fonte}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {resultado && resultado.status === 'sem_dados' && (
        <Card className="border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-medium">Nenhum dado encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Não foram encontrados dados para o CPF e data de nascimento informados. 
                  Verifique se os dados estão corretos e tente novamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
