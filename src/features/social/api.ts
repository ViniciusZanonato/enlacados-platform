import { supabase as dataClient } from '@/api/supabase/client';

export interface FriendRequest {
    id: number;
    from_user: string;
    to_user: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    created_at: string;
    from_user_profile?: {
        id: string;
        full_name: string;
        email: string;
        profile_type: string;
        avatar_url?: string;
    };
    to_user_profile?: {
        id: string;
        full_name: string;
        email: string;
        profile_type: string;
        avatar_url?: string;
    };
}

export interface Friendship {
    id: number;
    user1: string;
    user2: string;
    created_at: string;
    friend_profile?: {
        id: string;
        full_name: string;
        email: string;
        profile_type: string;
        avatar_url?: string;
    };
}

export const getFriendRequests = async () => {
    const { data, error } = await dataClient.rpc('social_get_friend_requests');
    if (error) throw error;
    return data || [];
};

export const sendFriendRequest = async (to_user: string) => {
    const { data, error } = await dataClient.rpc('social_send_friend_request', { p_to_user_id: to_user });
    if (error) throw error;
    return data;
};

export const acceptFriendRequest = async (id: number) => {
    const { data, error } = await dataClient.rpc('social_accept_friend_request', { p_request_id: id });
    if (error) throw error;
    return data;
};

export const rejectFriendRequest = async (id: number) => {
    const { data, error } = await dataClient.rpc('social_reject_friend_request', { p_request_id: id });
    if (error) throw error;
    return data;
};

export const getFriends = async () => {
    const { data, error } = await dataClient.rpc('social_get_friendships');
    if (error) throw error;
    return data || [];
};
