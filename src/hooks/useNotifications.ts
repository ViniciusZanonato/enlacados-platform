import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationApi from '@/features/notifications/api';

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.getNotifications,
        refetchInterval: 1000 * 60,
    });

    const unreadCountQuery = useQuery({
        queryKey: ['notificationsCount'],
        queryFn: notificationApi.getUnreadCount,
        refetchInterval: 1000 * 60,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string | number) => notificationApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: notificationApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
        },
    });

    return {
        notifications: Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [],
        unreadCount: unreadCountQuery.data?.unread_count || 0,
        isLoading: notificationsQuery.isLoading,
        markAsRead: (id: string | number) => markReadMutation.mutate(id),
        markAllRead: () => markAllReadMutation.mutate(),
    };
};
