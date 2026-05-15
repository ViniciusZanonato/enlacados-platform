import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Loader2 } from 'lucide-react';

export function ProfessionalLayout() {
    const { profile } = useAuth();

    // Fetch Professional ID to pass to child pages context
    const { data: professionalProfileId, isLoading } = useQuery({
        queryKey: ['professionalProfileId', profile?.id],
        queryFn: async () => {
            if (!profile) return null;

            const { data: profProfile, error } = await supabase
                .from('professional_profiles')
                .select('id')
                .eq('profile_id', profile.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching professional profile', error);
                return null;
            }
            return profProfile?.id || null;
        },
        enabled: !!profile,
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="w-full overflow-x-hidden">
            {/* You could add a specialized Professional Sub-header here if needed */}
            <Outlet context={{ professionalProfileId }} />
        </div>
    );
}
