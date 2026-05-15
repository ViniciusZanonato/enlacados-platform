import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface StudentSelfEnrollmentTabProps {
    institutionId: string;
}

export default function StudentSelfEnrollmentTab({ institutionId }: StudentSelfEnrollmentTabProps) {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    const { data: classes, isLoading } = useQuery({
        queryKey: ['availableClasses', institutionId],
        queryFn: async () => {
            if (!institutionId || institutionId === 'all') return [];
            // Fetch classes and their course details
            const { data, error } = await supabase
                .from('classes')
                .select('id, name, semester, capacity, courses(name)')
                .eq('institution_profile_id', institutionId);

            if (error) throw error;
            return data;
        },
        enabled: !!institutionId && institutionId !== 'all'
    });

    const { data: myEnrollments } = useQuery<any[]>({
        queryKey: ['myEnrollments', profile?.id],
        queryFn: async () => {
            if (!profile?.id) return [];
            const { data, error } = await supabase
                .from('class_students' as any)
                .select('class_id, status')
                .eq('student_id', profile.id);

            if (error) throw error;
            return data;
        },
        enabled: !!profile?.id
    });

    const enrollMutation = useMutation({
        mutationFn: async (classId: string) => {
            if (!profile?.id) throw new Error("Perfil não encontrado");
            const { error } = await supabase
                .from('class_students' as any)
                .insert({
                    class_id: classId,
                    student_id: profile.id,
                    status: 'pending_approval'
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Solicitação enviada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
        },
        onError: (error) => {
            toast.error(`Erro ao solicitar: ${error.message}`);
        }
    });

    const getEnrollmentStatus = (classId: string) => {
        if (!myEnrollments || !Array.isArray(myEnrollments)) return undefined;
        const enrollment = myEnrollments.find((e: any) => e.class_id === classId);
        return enrollment?.status;
    };

    const { data: settings, isLoading: isLoadingSettings } = useQuery<any>({
        queryKey: ['institutionalSettings', institutionId],
        queryFn: async () => {
            if (!institutionId || institutionId === 'all') return null;
            const { data, error } = await supabase
                .from('institutional_settings' as any)
                .select('*')
                .eq('institution_profile_id', institutionId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!institutionId && institutionId !== 'all'
    });

    if (isLoading || isLoadingSettings) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (institutionId === 'all') {
        return <div className="text-center p-8 text-muted-foreground">Selecione uma instituição acima para ver as disciplinas ofertadas.</div>;
    }

    const now = new Date();
    const start = settings?.enrollment_start_date ? new Date(settings.enrollment_start_date) : null;
    const end = settings?.enrollment_end_date ? new Date(settings.enrollment_end_date) : null;

    // If dates are defined, enforce them. If not defined, assume OPEN (or CLOSED? Defaulting to OPEN for now unless strict requirement).
    // User said "apenas no tempo definido", implies restriction exists ONLY IF defined? 
    // Re-reading: "pode em periodos de rematricula as cadeiras que, mas isto apenas no tempo que for definido."
    // It's a constraint. I'll enforce if EITHER is set.
    const isWindowDefined = start || end;
    const isWithinStart = !start || now >= start;
    const isWithinEnd = !end || now <= end;
    const isOpen = !isWindowDefined || (isWithinStart && isWithinEnd);

    if (!isOpen) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed border-2 rounded-lg bg-muted/10">
                <Clock className="h-12 w-12 mb-4 opacity-50 text-amber-500" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Período de Rematrícula Fechado</h3>
                <p>A solicitação de matrícula não está disponível no momento.</p>
                {(start || end) && (
                    <div className="mt-4 text-sm bg-background p-3 rounded border">
                        {start && <p>Início: <strong>{start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>}
                        {end && <p>Fim: <strong>{end.toLocaleDateString()} {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Oferta de Disciplinas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes?.map((cls: any) => {
                    const status = getEnrollmentStatus(cls.id);
                    const isEnrolled = status === 'active';
                    const isPending = status === 'pending_approval';

                    return (
                        <Card key={cls.id} className={isEnrolled ? "border-green-200 bg-green-50/20" : ""}>
                            <CardHeader>
                                <CardTitle className="text-lg">{cls.courses?.name || "Disciplina"}</CardTitle>
                                <CardDescription>{cls.name} • {cls.semester || 'Semestre N/A'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Vagas: {cls.capacity || '40'}</span>
                                    {/* Ideally show occupied count too */}
                                </div>
                            </CardContent>
                            <CardFooter>
                                {isEnrolled ? (
                                    <Button variant="ghost" className="w-full text-green-600 cursor-default hover:text-green-600 hover:bg-green-100/50">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Matriculado
                                    </Button>
                                ) : isPending ? (
                                    <Button variant="secondary" className="w-full cursor-default opacity-80">
                                        <Clock className="mr-2 h-4 w-4" /> Aguardando Aprovação
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => enrollMutation.mutate(cls.id)}
                                        disabled={enrollMutation.isPending}
                                    >
                                        {enrollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                        Solicitar Matrícula
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
                {classes?.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground">Nenhuma disciplina ofertada no momento.</p>
                )}
            </div>
        </div>
    );
}
