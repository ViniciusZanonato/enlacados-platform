import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const LinkedInstitutionsCard = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient(); // Add this import if missing

    const { data: institutions, isLoading } = useQuery({
        queryKey: ['professorInstitutions', profile?.id],
        queryFn: async () => {
            if (!profile?.id) return [];
            // Join institution_professors -> institutional_profiles
            const { data, error } = await supabase
                .from('institution_professors')
                .select(`
                    id, 
                    role,
                    status,
                    institution_profile_id,
                    institutional_profiles (
                        id,
                        institution_name,
                        logo_url
                    )
                `)
                .eq('profile_id', profile.id) as any;

            if (error) throw error;
            return data.map(item => ({
                link_id: item.id,
                status: item.status,
                role: item.role,
                institution_profile_id: item.institution_profile_id,
                ...item.institutional_profiles
            }));
        },
        enabled: !!profile?.id
    });

    const handleAccept = async (institutionProfileId: string) => {
        try {
            const { error } = await supabase
                .from('institution_professors')
                .update({ status: 'active' })
                .eq('institution_profile_id', institutionProfileId)
                .eq('profile_id', profile?.id);

            if (error) throw error;
            toast.success("Convite aceito com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['professorInstitutions'] });
            // Also invalidate KPIs or other relevant data
            queryClient.invalidateQueries({ queryKey: ['professorKpis'] });
        } catch (error) {
            console.error("Error accepting invitation:", error);
            toast.error("Erro ao aceitar convite.");
        }
    };

    const handleDecline = async (institutionProfileId: string) => {
        if (!confirm("Tem certeza que deseja recusar este convite?")) return;
        try {
            const { error } = await supabase
                .from('institution_professors')
                .delete()
                .eq('institution_profile_id', institutionProfileId)
                .eq('profile_id', profile?.id);

            if (error) throw error;
            toast.success("Convite recusado.");
            queryClient.invalidateQueries({ queryKey: ['professorInstitutions'] });
        } catch (error) {
            console.error("Error declining invitation:", error);
            toast.error("Erro ao recusar convite.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="h-4 w-4" /> Instituições Parceiras</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {institutions && institutions.length > 0 ? (
                            institutions.map((inst: any) => (
                                <div key={inst.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-background flex items-center justify-center border">
                                            {inst.logo_url ? (
                                                <img src={inst.logo_url} alt={inst.institution_name} className="h-8 w-8 object-contain" />
                                            ) : (
                                                <Building className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{inst.institution_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {inst.role || 'Professor'}
                                                {inst.status === 'pending' && <span className="ml-2 text-yellow-600 font-bold">(Pendente)</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {inst.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleDecline(inst.institution_profile_id)}>Recusar</Button>
                                            <Button size="sm" onClick={() => handleAccept(inst.institution_profile_id)}>Aceitar</Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">Nenhuma instituição vinculada.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
