import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "./DynamicBreadcrumb";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { UserAvatar } from "./UserAvatar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Lado Esquerdo */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <DynamicBreadcrumb />
        </div>
      </div>
      
      {/* Centro - Busca Global (Desktop) */}
      <div className="hidden lg:flex flex-1 justify-center max-w-md">
        <GlobalSearch />
      </div>
      
      {/* Lado Direito */}
      <div className="flex items-center gap-2">
        {/* Busca Mobile */}
        <div className="lg:hidden">
          <GlobalSearch />
        </div>
        
        {/* Notificações */}
        <NotificationsDrawer />
        
        {/* Avatar */}
        <UserAvatar />
      </div>
    </header>
  );
}
