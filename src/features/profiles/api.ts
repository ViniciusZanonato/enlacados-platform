import { api } from '@/lib/api-client';

export interface Profile {
    id: string;
    supabase_user_id: string;
    profile_type: 'student' | 'professional' | 'institutional';
    profile_type_display: string;
    full_name: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    institution_name?: string;
    is_verified: boolean;
    created_at: string;
}

export const getProfiles = async () => {
    return await api.get<Profile[]>('/profiles/');
};

export const updateProfile = async (id: string, data: Partial<Profile>) => {
    return await api.patch<Profile>(`/profiles/${id}/`, data);
};

export const deleteProfile = async (id: string) => {
    return await api.delete(`/profiles/${id}/`);
};
