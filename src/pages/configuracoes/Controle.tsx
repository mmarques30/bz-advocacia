import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sparkles, Video, Zap } from "lucide-react";
import GuiaDeUso from "./GuiaDeUso";
import Atualizacoes from "./Atualizacoes";
import Automacoes from "./Automacoes";
import Treinamentos from "./Treinamentos";

export default function Controle() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle</h1>
        <p className="text-muted-foreground mt-2">
          Guia de uso, atualizações do sistema, treinamentos e automações
        </p>
      </div>

      <Tabs defaultValue="guia" className="w-full">
        <TabsList>
          <TabsTrigger value="guia" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Guia de Uso
          </TabsTrigger>
          <TabsTrigger value="treinamentos" className="gap-2">
            <Video className="h-4 w-4" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="atualizacoes" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Atualizações
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2">
            <Zap className="h-4 w-4" />
            Automações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guia">
          <GuiaDeUso />
        </TabsContent>

        <TabsContent value="treinamentos">
          <Treinamentos />
        </TabsContent>

        <TabsContent value="atualizacoes">
          <Atualizacoes />
        </TabsContent>

        <TabsContent value="automacoes">
          <Automacoes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
