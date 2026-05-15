import { api } from '@/lib/api-client';

export interface Challenge {
    id: number;
    title: string;
    description?: string;
    xp_reward: number;
    type: string;
    condition_type: string;
    condition_threshold: number;
    is_completed?: boolean;
    progress?: number;
}

export interface LeaderboardEntry {
    rank_global: number;
    total_xp: number;
    profile?: {
        id: string;
        full_name: string;
        email: string;
        profile_type: string;
    };
}

export const getChallenges = async () => {
    return await api.get<Challenge[]>('/gamification/challenges/');
};

export const claimChallenge = async (id: number) => {
    return await api.post<{ status: string; xp_gained: number }>(`/gamification/challenges/${id}/claim/`);
};

export const getLeaderboard = async () => {
    return await api.get<LeaderboardEntry[]>('/gamification/leaderboard/');
};

export const getMyRank = async () => {
    return await api.get<LeaderboardEntry>('/gamification/leaderboard/me/');
};
