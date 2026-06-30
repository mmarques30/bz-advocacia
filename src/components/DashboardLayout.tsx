import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AIChatBox } from "./AIChatBox";


interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {/*
        Skip-to-content link: fica visualmente escondido ate receber
        foco via Tab; ai aparece no topo e permite usuario de teclado /
        leitor de tela pular a sidebar e o header indo direto ao conteudo
        principal. Padrao WCAG 2.1 (bypass blocks).
      */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
      <AIChatBox />
    </SidebarProvider>
  );
}
