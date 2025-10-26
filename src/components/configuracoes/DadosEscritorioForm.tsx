import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DadosEscritorioFormProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export function DadosEscritorioForm({ data, onChange }: DadosEscritorioFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Escritório</CardTitle>
        <CardDescription>Informações básicas sobre o escritório de advocacia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome_escritorio">Nome do Escritório *</Label>
            <Input
              id="nome_escritorio"
              value={data?.nome_escritorio || ""}
              onChange={(e) => onChange("nome_escritorio", e.target.value)}
              placeholder="Nome do Escritório"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={data?.cnpj || ""}
              onChange={(e) => onChange("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oab_principal">OAB Principal</Label>
            <Input
              id="oab_principal"
              value={data?.oab_principal || ""}
              onChange={(e) => onChange("oab_principal", e.target.value)}
              placeholder="OAB/SP 123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data?.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="contato@escritorio.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={data?.telefone || ""}
              onChange={(e) => onChange("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
