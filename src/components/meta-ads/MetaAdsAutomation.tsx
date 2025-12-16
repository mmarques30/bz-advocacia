import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function MetaAdsAutomation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Automação de Relatórios</CardTitle>
                <CardDescription>Configure o envio automático de relatórios para sua agência</CardDescription>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar envio automático</Label>
                <p className="text-sm text-muted-foreground">Enviar relatórios periodicamente</p>
              </div>
              <Switch disabled />
            </div>

            <div className="space-y-2 opacity-50">
              <Label>Frequência</Label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 opacity-50">
              <div className="space-y-2">
                <Label>Dia de envio</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Segunda-feira</SelectItem>
                    <SelectItem value="2">Terça-feira</SelectItem>
                    <SelectItem value="3">Quarta-feira</SelectItem>
                    <SelectItem value="4">Quinta-feira</SelectItem>
                    <SelectItem value="5">Sexta-feira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" disabled />
              </div>
            </div>

            <div className="space-y-2 opacity-50">
              <Label>Destinatários</Label>
              <Input placeholder="email@agencia.com" disabled />
              <p className="text-xs text-muted-foreground">Pressione Enter para adicionar múltiplos emails</p>
            </div>

            <div className="space-y-2 opacity-50">
              <Label>Assunto do email</Label>
              <Input placeholder="Relatório Semanal Meta Ads - B&Z" disabled />
            </div>

            <div className="space-y-2 opacity-50">
              <Label>Mensagem (opcional)</Label>
              <Textarea 
                placeholder="Segue relatório semanal de performance..."
                rows={3}
                disabled
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Próximo envio</p>
                  <p className="text-sm text-muted-foreground">Configure a automação para agendar envios</p>
                </div>
              </div>
            </div>

            <Button className="w-full" disabled>
              Salvar Configuração
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
