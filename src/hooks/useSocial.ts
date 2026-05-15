import { useState, useCallback, useEffect } from 'react';
import {
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    type Friendship,
    type FriendRequest
} from '@/features/social/api';
import { toast } from 'sonner';

export const useSocial = () => {
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // Sort friends by online status (mocked for now) or name
    const sortedFriends = [...friends].sort((a, b) => {
        const nameA = a.friend_profile?.full_name || '';
        const nameB = b.friend_profile?.full_name || '';
        return nameA.localeCompare(nameB);
    });

    const pendingRequests = requests.filter(r => r.status === 'PENDING');

    const loadSocialData = useCallback(async () => {
        try {
            setLoading(true);
            const [friendsData, requestsData] = await Promise.all([
                getFriends(),
                getFriendRequests()
            ]);
            setFriends(friendsData);
            setRequests(requestsData);
        } catch (error) {
            console.error('Error loading social data:', error);
            // Don't toast on initial load to avoid spamming the user if they're just browsing
        } finally {
            setLoading(false);
        }
    }, []);

    const sendRequest = async (userId: string) => {
        try {
            await sendFriendRequest(userId);
            toast.success('Solicitação de amizade enviada!');
            loadSocialData(); // Refresh to show potential status updates
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error('Erro ao enviar solicitação');
            throw error;
        }
    };

    const respondToRequest = async (requestId: number, accept: boolean) => {
        try {
            if (accept) {
                await acceptFriendRequest(requestId);
                toast.success('Solicitação aceita! Vocês agora são amigos.');
            } else {
                await rejectFriendRequest(requestId);
                toast.info('Solicitação recusada.');
            }
            // Optimistic update or reload
            loadSocialData();
        } catch (error) {
            console.error(`Error ${accept ? 'accepting' : 'rejecting'} request:`, error);
            toast.error('Ocorreu um erro ao processar a solicitação');
        }
    };

    useEffect(() => {
        loadSocialData();
    }, [loadSocialData]);

    return {
        friends: sortedFriends,
        requests: pendingRequests, // Only show pending requests in the UI list
        allRequests: requests,
        loading,
        loadSocialData,
        sendRequest,
        respondToRequest
    };
};
