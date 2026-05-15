import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    Users,
    DollarSign,
    Megaphone,
    Settings,
    LogOut,
    Library,
    BarChart3,
    ArrowRightLeft,
    PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';

export function InstitutionalSidebar() {
    const { profile, signOut } = useAuth();
    const location = useLocation();

    const { data: institutionName } = useQuery({
        queryKey: ['institutionName', profile?.id],
        queryFn: async () => {
            if (!profile) return null;
            const { data } = await supabase
                .from('institutional_profiles')
                .select('institution_name')
                .eq('profile_id', profile.id)
                .maybeSingle();
            return data?.institution_name ?? null;
        },
        enabled: !!profile,
    });

    const navItems = [
        { label: 'Visão Geral', icon: LayoutDashboard, path: '/portal/institutional/dashboard' },
        { label: 'Acadêmico', icon: BookOpen, path: '/portal/institutional/academic' },
        { label: 'Alunos', icon: GraduationCap, path: '/portal/institutional/students' },
        { label: 'Colaboradores', icon: Users, path: '/portal/institutional/faculty' },
        { label: 'Financeiro', icon: DollarSign, path: '/portal/institutional/finance' },
        { label: 'Comunicação', icon: Megaphone, path: '/portal/institutional/communication' },
        { label: 'CPA', icon: BarChart3, path: '/portal/cpa' },
        { label: 'Configurações', icon: Settings, path: '/portal/institutional/settings' },
    ];

    return (
        <aside className="w-60 border-r border-border/60 bg-card h-screen sticky top-0 flex flex-col relative overflow-hidden">
            {/* Subtle mesh overlay */}
            <div className="absolute inset-0 gradient-mesh opacity-25 pointer-events-none" />

            {/* Topo */}
            <div className="relative px-5 py-5 border-b border-border/50">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-8 w-8 bg-primary/15 border border-primary/25 rounded-lg flex items-center justify-center shrink-0">
                        <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-black text-sm gradient-text" style={{ letterSpacing: '-0.02em' }}>Enlaçados</span>
                </div>
                {institutionName && (
                    <p className="label-pill text-muted-foreground pl-10 truncate">{institutionName}</p>
                )}
            </div>

            {/* Nav */}
            <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-primary/12 text-primary border border-primary/25"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                                )}
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Rodapé */}
            <div className="relative px-4 pb-5 border-t border-border/50 mt-auto pt-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/15">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                            {profile?.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{profile?.full_name}</p>
                        <p className="label-pill text-muted-foreground truncate">
                            {profile?.profile_type?.map(type => ({
                                institutional: 'Institucional',
                                family: 'Familiar',
                                professional: 'Especialista',
                                personal: 'Aluno',
                                admin: 'Admin'
                            }[type] || type)).join(' & ')}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="h-7 w-7 hover:text-destructive">
                        <LogOut className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Portal Switcher - Only shows if multi-role */}
                {profile?.profile_type && profile.profile_type.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Alternar Portal</p>
                        <div className="grid grid-cols-1 gap-1">
                            {profile.profile_type
                                .filter(type => type !== 'institutional') // Don't show current role link redundantly
                                .map(type => {
                                    const portalMap: Record<string, { label: string; path: string }> = {
                                        personal: { label: 'Portal do Aluno', path: '/portal/student' },
                                        family: { label: 'Portal da Família', path: '/portal/family' },
                                        professional: { label: 'Portal do Especialista', path: '/portal/professional' },
                                    };
                                    const config = portalMap[type];
                                    if (!config) return null;
                                    return (
                                        <Button 
                                            key={type} 
                                            variant="ghost" 
                                            size="sm" 
                                            asChild 
                                            className="justify-start h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                                        >
                                            <Link to={config.path}>
                                                <ArrowRightLeft className="mr-2 h-3 w-3" />
                                                {config.label}
                                            </Link>
                                        </Button>
                                    );
                                })}
                        </div>
                    </div>
                )}
                
                {/* Expand Role Option */}
                <div className="mt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild 
                        className="w-full justify-start h-8 text-[10px] text-muted-foreground hover:text-primary group"
                    >
                        <Link to="/portal/setup">
                            <PlusCircle className="mr-2 h-3 w-3 group-hover:scale-110 transition-transform" />
                            Liberar outro papel...
                        </Link>
                    </Button>
                </div>
            </div>
        </aside>
    );
}
