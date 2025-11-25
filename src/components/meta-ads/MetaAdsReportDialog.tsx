import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Mail } from "lucide-react";
import { toast } from "sonner";

export function MetaAdsReportDialog() {
  const [open, setOpen] = useState(false);
  const [formato, setFormato] = useState<"pdf" | "excel">("pdf");
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulação de geração (será implementado quando credenciais estiverem disponíveis)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("Relatório gerado com sucesso!");
    setIsGenerating(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatório Meta Ads</DialogTitle>
          <DialogDescription>
            Configure as opções do relatório de performance
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data-inicio" className="text-xs text-muted-foreground">Data Início</Label>
                <Input id="data-inicio" type="date" />
              </div>
              <div>
                <Label htmlFor="data-fim" className="text-xs text-muted-foreground">Data Fim</Label>
                <Input id="data-fim" type="date" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <RadioGroup value={formato} onValueChange={(value) => setFormato(value as "pdf" | "excel")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="font-normal cursor-pointer">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="font-normal cursor-pointer">Excel</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Métricas Incluídas</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="investimento" defaultChecked disabled />
                <Label htmlFor="investimento" className="font-normal cursor-pointer">Investimento total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="leads-gerados" defaultChecked disabled />
                <Label htmlFor="leads-gerados" className="font-normal cursor-pointer">Leads gerados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="custo-lead" defaultChecked disabled />
                <Label htmlFor="custo-lead" className="font-normal cursor-pointer">Custo por lead</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="performance" defaultChecked />
                <Label htmlFor="performance" className="font-normal cursor-pointer">Performance por campanha</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="enviar-email" checked={enviarEmail} onCheckedChange={(checked) => setEnviarEmail(checked as boolean)} />
              <Label htmlFor="enviar-email" className="font-normal cursor-pointer">Enviar por email</Label>
            </div>
            {enviarEmail && (
              <Input
                type="email"
                placeholder="destinatario@agencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
            {isGenerating ? (
              <>Gerando...</>
            ) : (
              <>
                {enviarEmail ? <Mail className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {enviarEmail ? "Gerar e Enviar" : "Gerar Relatório"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
