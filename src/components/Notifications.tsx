import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

const Notifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllRead, isLoading } = useNotifications();

  // Real-time: tabela `notifications` no Supabase
  useEffect(() => {
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // toast ao inserir
          toast.info(payload.new.title || 'Nova Notificação', {
            description: payload.new.message,
            icon: <BellRing className="w-4 h-4 text-primary" />,
            action: (payload.new.action_url || payload.new.link) ? {
              label: 'Ver',
              onClick: () => {
                const target = payload.new.action_url || payload.new.link;
                if (target && /^\/(?!\/)/.test(target)) navigate(target);
              }
            } : undefined,
          });


          // invalida cache da lista
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, navigate]);

  const getIcon = (type: string | null) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cpa': return <Info className="h-4 w-4 text-blue-500" />;
      case 'comment': return <Info className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 font-normal"
              onClick={(e) => {
                e.preventDefault();
                markAllRead();
              }}
            >
              Marcar tudo como lido
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 px-4">
              <Clock className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center opacity-40">
              <Bell className="h-10 w-10 mb-2" />
              <p className="text-sm">Nenhuma notificação nova.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-4 border-b last:border-0 cursor-pointer focus:bg-muted/50 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!notification.is_read) markAsRead(notification.id);
                    const targetLink = notification.final_link || notification.action_url || notification.link;
                    if (targetLink && /^\/(?!\/)/.test(targetLink)) navigate(targetLink);
                  }}
                >
                  <div className="flex w-full gap-3">
                    <div className="mt-0.5">
                      {getIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title || 'Notificação'}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-normal text-muted-foreground hover:text-primary"
            onClick={() => navigate('/perfil/notificacoes')}
            disabled
          >
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
