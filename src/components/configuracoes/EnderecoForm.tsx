import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EnderecoFormProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export function EnderecoForm({ data, onChange }: EnderecoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço</CardTitle>
        <CardDescription>Localização do escritório</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="endereco_completo">Endereço Completo</Label>
          <Input
            id="endereco_completo"
            value={data?.endereco_completo || ""}
            onChange={(e) => onChange("endereco_completo", e.target.value)}
            placeholder="Rua, número, complemento"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={data?.cidade || ""}
              onChange={(e) => onChange("cidade", e.target.value)}
              placeholder="São Paulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={data?.estado || ""}
              onChange={(e) => onChange("estado", e.target.value)}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={data?.cep || ""}
            onChange={(e) => onChange("cep", e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </CardContent>
    </Card>
  );
}
