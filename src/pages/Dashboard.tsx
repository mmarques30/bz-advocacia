import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logoBZ from "@/assets/logo-bz-new.png";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoBZ} alt="B&Z Advocacia" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-seasons font-bold text-card-foreground">
                B&Z Advocacia
              </h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h2 className="text-2xl font-seasons font-bold text-card-foreground mb-4">
            Bem-vindo ao Dashboard
          </h2>
          <p className="text-muted-foreground mb-2">
            Olá, <span className="font-semibold text-foreground">{user?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Sistema de gerenciamento de leads e casos em desenvolvimento.
          </p>
        </div>
      </main>
    </div>
  );
}
