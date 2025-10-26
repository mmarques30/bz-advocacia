import { CheckCircle } from "lucide-react";
import logoBZ from "@/assets/logo-bz.png";

export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-[var(--shadow-elegant)]">
        <div className="flex justify-center">
          <img src={logoBZ} alt="B&Z Advocacia" className="h-20 w-auto" />
        </div>
        
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-primary" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-card-foreground">
            Recebemos seu contato!
          </h1>
          <p className="text-lg text-muted-foreground">
            Retornaremos em até 24 horas.
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground pt-4">
          Nossa equipe está analisando suas informações e entrará em contato em breve
          para dar continuidade ao seu atendimento.
        </p>
      </div>
    </div>
  );
}
