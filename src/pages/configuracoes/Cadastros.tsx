import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users } from "lucide-react";
import Perfil from "./Perfil";
import Usuarios from "./Usuarios";

export default function Cadastros() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu perfil e os usuários do escritório
        </p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Perfil />
        </TabsContent>

        <TabsContent value="usuarios">
          <Usuarios />
        </TabsContent>
      </Tabs>
    </div>
  );
}
