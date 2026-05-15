import { api } from '@/lib/api-client';

export interface ChatRoom {
    id: string;
    name?: string;
    is_group: boolean;
    last_message_at?: string;
    participants: string[];
    participants_profiles?: Array<{
        id: string;
        full_name: string;
        email: string;
    }>;
    last_message?: Message;
    unread_count?: number;
}

export interface Message {
    id: string;
    room: string;
    sender: string;
    content: string;
    created_at: string;
    read_by: string[];
    metadata?: Record<string, any>;
    sender_profile?: {
        id: string;
        full_name: string;
        email: string;
    };
    is_me?: boolean;
}

export const getChatRooms = async () => {
    return await api.get<ChatRoom[]>('/chat/rooms/');
};

export const createChatRoom = async (data: { name?: string; is_group: boolean; participants: string[] }) => {
    return await api.post<ChatRoom>('/chat/rooms/', data);
};

export const startDirectMessage = async (user_id: string) => {
    return await api.post<ChatRoom>('/chat/rooms/start_dm/', { user_id });
};

export const getMessages = async (room_id: string) => {
    return await api.get<Message[]>(`/chat/messages/?room_id=${room_id}`);
};

export const sendMessage = async (room: string, content: string, metadata?: Record<string, any>) => {
    return await api.post<Message>('/chat/messages/', { room, content, metadata });
};

export const markRoomAsRead = async (room_id: string) => {
    return await api.post<{ status: string }>(`/chat/rooms/${room_id}/mark_read/`);
};
