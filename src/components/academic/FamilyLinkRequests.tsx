import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FamilyLinkRequest {
    id: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
    relationship_type: string | null;
    parent_phone: string | null;
    lgpd_accepted: boolean;
    family: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        email: string;
    };
    student: {
        id: string;
        full_name: string;
        cpf: string;
    };
}

interface FamilyLinkRequestsProps {
    institutionalProfileId: string;
}

export function FamilyLinkRequests({ institutionalProfileId }: FamilyLinkRequestsProps) {
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery<FamilyLinkRequest[]>({
        queryKey: ['familyLinkRequests', institutionalProfileId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('family_links')
                .select(`
                    id,
                    status,
                    created_at,
                    relationship_type,
                    parent_phone,
                    lgpd_accepted,
                    family:profiles!family_profile_id(id, full_name, avatar_url, email),
                    student:profiles!student_profile_id(id, full_name, cpf)
                `)
                .eq('institution_profile_id', institutionalProfileId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as any;
        },
        enabled: !!institutionalProfileId
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: 'active' | 'rejected' }) => {
            const { error } = await supabase
                .from('family_links')
                .update({ 
                    status,
                    approved_at: status === 'active' ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            toast.success(variables.status === 'active' ? "Vínculo aprovado!" : "Vínculo rejeitado.");
            queryClient.invalidateQueries({ queryKey: ['familyLinkRequests'] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao processar: ${error.message}`);
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Solicitações de Vínculo Familiar</CardTitle>
                <CardDescription>Responsáveis que solicitaram acesso aos dados de estudantes desta instituição.</CardDescription>
            </CardHeader>
            <CardContent>
                {requests && requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium flex items-center gap-2">
                                            {req.family?.full_name || 'Familiar'}
                                            {req.relationship_type && (
                                                <Badge variant="outline" className="text-[10px] py-0">{req.relationship_type}</Badge>
                                            )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Solicitou vínculo com: <span className="text-foreground font-semibold">{req.student?.full_name || 'Aluno em identificação'}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                            {req.parent_phone && (
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Badge variant="secondary" className="text-[8px] bg-blue-50 text-blue-700 border-blue-100">Tel: {req.parent_phone}</Badge>
                                                </p>
                                            )}
                                            {req.lgpd_accepted && (
                                                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> Termo LGPD Aceito
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Rejeitar
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'active' })}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        <Check className="h-4 w-4 mr-1" /> Aprovar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground italic">
                        Nenhuma solicitação pendente no momento.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
