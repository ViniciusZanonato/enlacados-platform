import { useState, useEffect, useCallback } from 'react';
import {
    getChatRooms,
    getMessages,
    sendMessage,
    markRoomAsRead,
    startDirectMessage,
    type ChatRoom,
    type Message
} from '@/features/chat/api';
import { toast } from 'sonner';

export const useChat = () => {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const loadRooms = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await getChatRooms();
            setRooms(data);
        } catch (error) {
            console.error('Error loading rooms:', error);
            toast.error('Erro ao carregar conversas');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const loadMessages = useCallback(async (roomId: string) => {
        try {
            const data = await getMessages(roomId);
            setMessages(data);
            // Mark as read when loading messages
            await markRoomAsRead(roomId);
            // Update local unread count
            setRooms(prev => prev.map(r =>
                r.id === roomId ? { ...r, unread_count: 0 } : r
            ));
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Erro ao carregar mensagens');
        }
    }, []);

    const selectRoom = useCallback((room: ChatRoom | null) => {
        setSelectedRoom(room);
        if (room) {
            loadMessages(room.id);
        } else {
            setMessages([]);
        }
    }, [loadMessages]);

    const sendMsg = async (content: string) => {
        if (!selectedRoom) return;

        try {
            setSending(true);
            const newMsg = await sendMessage(selectedRoom.id, content);
            setMessages(prev => [...prev, newMsg]);

            // Update room's last message in the list
            setRooms(prev => prev.map(r =>
                r.id === selectedRoom.id
                    ? { ...r, last_message: newMsg, last_message_at: newMsg.created_at }
                    : r
            ).sort((a, b) => {
                const dateA = new Date(a.last_message_at || 0).getTime();
                const dateB = new Date(b.last_message_at || 0).getTime();
                return dateB - dateA;
            }));

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Erro ao enviar mensagem');
            throw error;
        } finally {
            setSending(false);
        }
    };

    const startDM = async (userId: string) => {
        try {
            setLoading(true);
            const room = await startDirectMessage(userId);

            // Add to list if not exists
            setRooms(prev => {
                if (!prev.find(r => r.id === room.id)) {
                    return [room, ...prev];
                }
                return prev;
            });

            selectRoom(room);
            return room;
        } catch (error) {
            console.error('Error starting DM:', error);
            toast.error('Erro ao iniciar conversa');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    // Optional: Poll for new messages (simple implementation)
    useEffect(() => {
        if (!selectedRoom) return;

        const interval = setInterval(() => {
            // Silently refresh messages
            getMessages(selectedRoom.id).then(data => {
                if (data.length > messages.length) {
                    setMessages(data);
                    markRoomAsRead(selectedRoom.id);
                }
            }).catch(() => {
                // Falha silenciosa no polling — não interrompe a experiência do usuário
            });
        }, 5000); // 5 seconds polling

        return () => clearInterval(interval);
    }, [selectedRoom, messages.length]);

    return {
        rooms,
        messages,
        selectedRoom,
        loading,
        sending,
        loadRooms,
        selectRoom,
        sendMsg,
        startDM
    };
};
