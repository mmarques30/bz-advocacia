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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
      <AIChatBox />
    </SidebarProvider>
  );
}
