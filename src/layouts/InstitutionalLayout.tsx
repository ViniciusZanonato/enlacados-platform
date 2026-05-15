import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { InstitutionalSidebar } from '@/components/layout/InstitutionalSidebar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Home, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Notifications from '@/components/Notifications';

export function InstitutionalLayout() {
    const { profile } = useAuth();

    // Fetch Institution ID to pass to child pages context
    const { data: institutionalProfileId } = useQuery({
        queryKey: ['institutionalProfileId', profile?.id],
        queryFn: async () => {
            if (!profile || !profile.profile_type?.includes('institutional')) return null;
            const { data: instProfile, error } = await supabase.from('institutional_profiles').select('id').eq('profile_id', profile.id).maybeSingle();
            if (error) throw new Error(`Failed to fetch institutional profile: ${error.message}`);
            return instProfile?.id || null;
        },
        enabled: !!profile,
    });

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <InstitutionalSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-card flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                            <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Voltar ao Início</span>
                        </Link>
                        <div className="h-6 w-px bg-border hidden sm:block" />
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            {profile?.full_name ? `Bem-vindo, ${profile.full_name}` : 'Portal Institucional'}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Notifications />
                        <div className="flex items-center gap-3 border-l pl-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                <p className="text-xs text-muted-foreground">Administrador</p>
                            </div>
                            <Avatar>
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Pass context to Outlet */}
                        <Outlet context={{ institutionalProfileId }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
