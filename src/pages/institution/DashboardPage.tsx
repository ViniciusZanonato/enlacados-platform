import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import KPIDashboard from '@/components/dashboard/KPIDashboard';
import ProfileViewsChart from '@/components/charts/ProfileViewsChart';
import StudentGrowthChart from '@/components/charts/StudentGrowthChart';
import IESWizard from '@/components/onboarding/IESWizard';

export function DashboardPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const { profile } = useAuth();

    if (!institutionalProfileId || !profile) return (
        <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando visão geral...</span>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <span className="label-pill text-primary/70 block mb-2">Portal institucional</span>
                <h2 className="text-4xl leading-none">Visão Geral</h2>
            </div>

            <IESWizard />

            <KPIDashboard profileId={profile.id} />

            <div className="grid md:grid-cols-2 gap-6">
                <ProfileViewsChart profileId={institutionalProfileId} />
                <StudentGrowthChart institutionalProfileId={institutionalProfileId} />
            </div>
        </div>
    );
}
