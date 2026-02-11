import { useState } from "react";
import ContactForm from "@/components/ContactForm";
import Success from "./Success";
import logoBZ from "@/assets/logo-bz-new.png";
import lawyersImg from "@/assets/lawyers-new.png";

export default function Index() {
  const [showSuccess, setShowSuccess] = useState(false);

  if (showSuccess) {
    return <Success />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images with Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[image:var(--gradient-overlay)]" style={{
          background: 'linear-gradient(135deg, hsla(72, 6%, 18%, 0.35) 0%, hsla(220, 4%, 40%, 0.25) 100%)'
        }} />
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url(${lawyersImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-card/30 backdrop-blur-xl rounded-3xl shadow-[var(--shadow-elegant)] border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/3 to-secondary/3 p-8 text-center border-b border-border/50">
              <div className="flex justify-center mb-6">
                <img src={logoBZ} alt="B&Z Advocacia" className="h-40 w-auto" />
              </div>
              <h1 className="text-4xl font-bold text-card-foreground mb-2">
                Fale Conosco
              </h1>
              <p className="text-lg text-muted-foreground">
                Borges & Zembruski Advocacia
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Preencha o formulário abaixo e nossa equipe entrará em contato em até 24 horas
              </p>
            </div>

            {/* Form */}
            <div className="p-8">
              <ContactForm onSuccess={() => setShowSuccess(true)} />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70">
              © 2025 Borges & Zembruski Advocacia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
