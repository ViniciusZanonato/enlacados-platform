import { supabase } from '@/api/supabase/client';

export interface Notification {
  id: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | 'cpa' | 'comment' | 'mention' | 'system' | null;
  title: string | null;
  message: string;
  action_url: string | null;
  action_text: string | null;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
};

export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) throw error;
  return { unread_count: count ?? 0 };
};

export const markAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const markAllRead = async (): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);
  if (error) throw error;
};
