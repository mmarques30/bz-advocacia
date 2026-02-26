import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
import { useUpdateClienteDados } from "@/hooks/useContratos";

interface ClienteData {
  id: string;
  cpf?: string | null;
  rg?: string | null;
  nacionalidade?: string | null;
  profissao?: string | null;
  estado_civil?: string | null;
  endereco_completo?: string | null;
  endereco_cep?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
}

interface ClienteDataPanelProps {
  cliente: ClienteData;
}

const ESTADOS_CIVIS = [
  { value: 'solteiro(a)', label: 'Solteiro(a)' },
  { value: 'casado(a)', label: 'Casado(a)' },
  { value: 'divorciado(a)', label: 'Divorciado(a)' },
  { value: 'viúvo(a)', label: 'Viúvo(a)' },
  { value: 'separado(a)', label: 'Separado(a)' },
  { value: 'união estável', label: 'União Estável' },
];

export function ClienteDataPanel({ cliente }: ClienteDataPanelProps) {
  const [open, setOpen] = useState(false);
  const updateDados = useUpdateClienteDados();
  
  const [cpf, setCpf] = useState(cliente.cpf || '');
  const [rg, setRg] = useState(cliente.rg || '');
  const [nacionalidade, setNacionalidade] = useState(cliente.nacionalidade || 'brasileiro(a)');
  const [profissao, setProfissao] = useState(cliente.profissao || '');
  const [estadoCivil, setEstadoCivil] = useState(cliente.estado_civil || '');
  const [enderecoCompleto, setEnderecoCompleto] = useState(cliente.endereco_completo || '');
  const [cep, setCep] = useState(cliente.endereco_cep || '');
  const [cidade, setCidade] = useState(cliente.endereco_cidade || '');
  const [estado, setEstado] = useState(cliente.endereco_estado || '');

  // Sync when client changes
  useEffect(() => {
    setCpf(cliente.cpf || '');
    setRg(cliente.rg || '');
    setNacionalidade(cliente.nacionalidade || 'brasileiro(a)');
    setProfissao(cliente.profissao || '');
    setEstadoCivil(cliente.estado_civil || '');
    setEnderecoCompleto(cliente.endereco_completo || '');
    setCep(cliente.endereco_cep || '');
    setCidade(cliente.endereco_cidade || '');
    setEstado(cliente.endereco_estado || '');
  }, [cliente]);

  const hasChanges = 
    cpf !== (cliente.cpf || '') ||
    rg !== (cliente.rg || '') ||
    nacionalidade !== (cliente.nacionalidade || 'brasileiro(a)') ||
    profissao !== (cliente.profissao || '') ||
    estadoCivil !== (cliente.estado_civil || '') ||
    enderecoCompleto !== (cliente.endereco_completo || '') ||
    cep !== (cliente.endereco_cep || '') ||
    cidade !== (cliente.endereco_cidade || '') ||
    estado !== (cliente.endereco_estado || '');

  const handleSalvar = () => {
    updateDados.mutate({
      id: cliente.id,
      cpf: cpf || null,
      rg: rg || null,
      nacionalidade: nacionalidade || null,
      profissao: profissao || null,
      estado_civil: estadoCivil || null,
      situacao_atual: estadoCivil || null,
      endereco_completo: enderecoCompleto || null,
      endereco_cep: cep || null,
      endereco_cidade: cidade || null,
      endereco_estado: estado || null,
    });
  };

  const missingFields = [
    !cpf && 'CPF',
    !rg && 'RG',
    !profissao && 'Profissão',
    !estadoCivil && 'Estado Civil',
    !enderecoCompleto && 'Endereço',
  ].filter(Boolean);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between" type="button">
          <span className="flex items-center gap-2 text-sm">
            Dados Pessoais do Cliente
            {missingFields.length > 0 && (
              <span className="text-xs text-amber-600 font-normal">
                ({missingFields.length} campo(s) vazio(s))
              </span>
            )}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">CPF</Label>
            <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RG</Label>
            <Input value={rg} onChange={e => setRg(e.target.value)} placeholder="RG" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Nacionalidade</Label>
            <Input value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Profissão</Label>
            <Input value={profissao} onChange={e => setProfissao(e.target.value)} placeholder="Profissão" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Estado Civil</Label>
          <Select value={estadoCivil} onValueChange={setEstadoCivil}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_CIVIS.map(ec => (
                <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Endereço Completo</Label>
          <Input value={enderecoCompleto} onChange={e => setEnderecoCompleto(e.target.value)} placeholder="Rua, número, bairro..." />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">CEP</Label>
            <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cidade</Label>
            <Input value={cidade} onChange={e => setCidade(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Input value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" />
          </div>
        </div>
        {hasChanges && (
          <Button onClick={handleSalvar} disabled={updateDados.isPending} size="sm" className="w-full">
            {updateDados.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Dados do Cliente
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
