import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PreferenciasFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function PreferenciasForm({ data, onChange }: PreferenciasFormProps) {
  const handlePreferenciaChange = (pref: string, value: any) => {
    onChange("preferencias", {
      ...(data?.preferencias || {}),
      [pref]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências do Sistema</CardTitle>
        <CardDescription>Configure o comportamento do sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notificacoes_email">Notificações por Email</Label>
            <p className="text-sm text-muted-foreground">
              Receber notificações importantes por email
            </p>
          </div>
          <Switch
            id="notificacoes_email"
            checked={data?.preferencias?.notificacoes_email || false}
            onCheckedChange={(checked) => handlePreferenciaChange("notificacoes_email", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="alertas_prazos">Alertas de Prazos Urgentes</Label>
            <p className="text-sm text-muted-foreground">
              Receber alertas quando prazos estiverem próximos
            </p>
          </div>
          <Switch
            id="alertas_prazos"
            checked={data?.preferencias?.alertas_prazos || false}
            onCheckedChange={(checked) => handlePreferenciaChange("alertas_prazos", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="backup_automatico">Backup Automático Semanal</Label>
            <p className="text-sm text-muted-foreground">
              Realizar backup dos dados semanalmente
            </p>
          </div>
          <Switch
            id="backup_automatico"
            checked={data?.preferencias?.backup_automatico || false}
            onCheckedChange={(checked) => handlePreferenciaChange("backup_automatico", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuso_horario">Fuso Horário</Label>
          <Select
            value={data?.preferencias?.fuso_horario || "America/Sao_Paulo"}
            onValueChange={(value) => handlePreferenciaChange("fuso_horario", value)}
          >
            <SelectTrigger id="fuso_horario">
              <SelectValue placeholder="Selecione o fuso horário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
              <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
              <SelectItem value="America/Rio_Branco">Acre (GMT-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
