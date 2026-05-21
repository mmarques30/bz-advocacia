import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Users, Scale, DollarSign, Search, MessageSquare, Settings, FileText, Lock, Video, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SenhasSistema from "./SenhasSistema";

const MATERIAL_TREINAMENTO = [
  {
    id: "documento",
    icon: FileText,
    titulo: "Manual de uso (documento)",
    descricao: "Documento completo com o passo a passo do sistema",
    url: "https://docs.google.com/document/d/13JSvSCbyNHMWUjAk2mY1xezoAjWgwU6Wn3DWa9q9RDY/edit?usp=sharing",
  },
  {
    id: "video",
    icon: Video,
    titulo: "Vídeo de treinamento",
    descricao: "Treinamento em vídeo gravado pela equipe",
    url: "https://drive.google.com/file/d/1QsDqNItHMb8WWXvpcTzyzRCBqHYnSD10/view?usp=sharing",
  },
];

const guias = [
  {
    id: "vendas",
    icon: Users,
    titulo: "Gestão de Vendas e Leads",
    conteudo: [
      "Como cadastrar novos leads manualmente",
      "Entenda o funil de vendas e os estágios de cada lead",
      "Análises e métricas de conversão para otimizar resultados",
      "Integração com Marketing para acompanhar campanhas",
      "Como mover leads entre os estágios do funil"
    ]
  },
  {
    id: "processos",
    icon: Scale,
    titulo: "Processos Jurídicos",
    conteudo: [
      "Como cadastrar um novo processo",
      "Gerenciamento de prazos e alertas automáticos",
      "Upload e organização de documentos por processo",
      "Acompanhamento de andamentos processuais",
      "Vinculando processos a clientes/leads"
    ]
  },
  {
    id: "financeiro",
    icon: DollarSign,
    titulo: "Gestão Financeira",
    conteudo: [
      "Visão geral do dashboard financeiro",
      "Controle de receitas e despesas",
      "Gerando relatórios financeiros personalizados",
      "Acompanhamento de faturamento mensal",
      "Análise de categorias e subcategorias"
    ]
  },
  {
    id: "pesquisas",
    icon: Search,
    titulo: "Pesquisas e Consultas",
    conteudo: [
      "Como realizar pesquisas de pessoa física/jurídica",
      "Consultando histórico de pesquisas anteriores",
      "Entendendo os créditos de consulta",
      "Configuração da API de pesquisa"
    ]
  },
  {
    id: "comunicacao",
    icon: MessageSquare,
    titulo: "Comunicação e WhatsApp",
    conteudo: [
      "Configurando a integração com WhatsApp",
      "Criando templates de mensagem",
      "Enviando mensagens para clientes",
      "Visualizando histórico de comunicações"
    ]
  },
  {
    id: "templates",
    icon: FileText,
    titulo: "Templates de Documentos",
    conteudo: [
      "Como criar um novo template",
      "Utilizando variáveis dinâmicas nos templates",
      "Gerando documentos a partir de templates",
      "Organizando templates por categoria"
    ]
  },
  {
    id: "configuracoes",
    icon: Settings,
    titulo: "Configurações do Sistema",
    conteudo: [
      "Gerenciando seu perfil de usuário",
      "Adicionando e removendo usuários",
      "Configurando permissões de acesso",
      "Templates de WhatsApp personalizados"
    ]
  }
];

export default function GuiaDeUso() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Guia de Uso
        </h1>
        <p className="text-muted-foreground mt-2">
          Aprenda a utilizar todas as funcionalidades do sistema
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {MATERIAL_TREINAMENTO.map((material) => {
          const Icon = material.icon;
          return (
            <a
              key={material.id}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{material.titulo}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{material.descricao}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-4">
          {guias.map((guia) => {
            const Icon = guia.icon;
            return (
              <AccordionItem key={guia.id} value={guia.id} className="border-0">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-semibold text-lg">{guia.titulo}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0 pb-4">
                      <ul className="space-y-3 pl-2">
                        {guia.conteudo.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}

          {isAdmin && (
            <AccordionItem value="senhas" className="border-0">
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Lock className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="font-semibold text-lg">Senhas do Sistema</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0 pb-4">
                    <SenhasSistema hideHeader />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
}
