import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, List } from "lucide-react";
import ComunicacaoTemplates from "@/pages/comunicacao/Templates";
import ListasSuspensas from "./ListasSuspensas";

export default function Modelos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Modelos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie modelos de mensagens e listas do sistema
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Modelos Chat
          </TabsTrigger>
          <TabsTrigger value="listas" className="gap-2">
            <List className="h-4 w-4" />
            Listas do Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ComunicacaoTemplates />
        </TabsContent>

        <TabsContent value="listas">
          <ListasSuspensas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
