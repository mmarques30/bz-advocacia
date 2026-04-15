import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, X, MoreVertical, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { NOTIFICATION_CONFIG } from "@/types/notifications";
import { cn } from "@/lib/utils";

export function NotificationsDrawer() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: notifications, isLoading } = useNotifications(filter);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  
  const handleNotificationClick = (notification: any) => {
    if (!notification.lida) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };
  
  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount ? `Notificações (${unreadCount} não lida${unreadCount > 1 ? 's' : ''})` : 'Notificações'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="border-b p-5 space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
          </div>
          
          {/* Tabs de filtro */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Não lidas
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>
        
        {/* Lista de notificações */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.tipo];
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex gap-3 p-4 hover:bg-accent cursor-pointer transition-colors",
                      !notification.lida && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    {/* Ícone */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                      config.color
                    )}>
                      <config.icon className="h-5 w-5" />
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm",
                        !notification.lida && "font-semibold"
                      )}>
                        {notification.titulo}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.descricao}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    
                    {/* Ações */}
                    <div className="flex items-start gap-2">
                      {!notification.lida && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Abrir ações da notificação">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.lida && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead.mutate(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Marcar como lida
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <div className="text-sm font-medium">Você está em dia!</div>
              <div className="text-xs text-muted-foreground mt-1">
                Nenhuma notificação no momento
              </div>
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications && notifications.length > 0 && unreadCount && unreadCount > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
