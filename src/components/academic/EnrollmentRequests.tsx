import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface EnrollmentRequestsProps {
    institutionalProfileId: string;
}

export function EnrollmentRequests({ institutionalProfileId }: EnrollmentRequestsProps) {
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ['enrollmentRequests', institutionalProfileId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_students' as any)
                .select(`
                    id,
                    student_id,
                    status,
                    student:profiles!inner(id, full_name, cpf),
                    class:classes!inner(id, name, semester, institution_profile_id, courses(name))
                `)
                .eq('status', 'pending_approval')
                .eq('class.institution_profile_id', institutionalProfileId);

            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionalProfileId
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, studentProfileId, courseName, courseCode, semester }: { id: string, status: string, studentProfileId?: string, courseName?: string, courseCode?: string, semester?: string }) => {
            // Update class_students
            const { error } = await supabase
                .from('class_students' as any)
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            // If approved, also sync to academic_history
            if (status === 'active' && studentProfileId) {
                await supabase.from('academic_history').insert({
                    student_profile_id: studentProfileId,
                    institutional_profile_id: institutionalProfileId,
                    course_code: courseCode || 'N/A',
                    course_name: courseName || 'Curso',
                    semester: semester || 'S1',
                    grade: null,
                    absences: 0
                });
            }
        },
        onSuccess: () => {
            toast.success("Solicitação processada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['enrollmentRequests'] });
        },
        onError: (error) => {
            toast.error(`Erro ao processar: ${error.message}`);
        }
    });

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-7 w-64 mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                            <Skeleton className="h-3 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-full rounded-md" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <p className="text-xs text-center text-muted-foreground animate-pulse">Carregando solicitações...</p>
        </div>
    );

    if (!requests || requests.length === 0) {
        return <div className="text-center p-8 text-muted-foreground border rounded-lg bg-slate-50">Nenhuma solicitação de matrícula pendente.</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Solicitações Pendentes</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((req: any) => (
                    <Card key={req.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {req.student?.full_name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                CPF: {req.student?.cpf}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-sm">
                                <p className="font-semibold text-foreground">{req.class?.courses?.name}</p>
                                <p className="text-muted-foreground">{req.class?.name} • {req.class?.semester}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => updateStatusMutation.mutate({
                                        id: req.id,
                                        status: 'active',
                                        studentProfileId: req.student?.id,
                                        courseName: req.class?.courses?.name,
                                        courseCode: req.class?.id.substring(0, 6),
                                        semester: req.class?.semester
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <Check className="h-4 w-4 mr-1" /> Aprovar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => updateStatusMutation.mutate({
                                        id: req.id,
                                        status: 'rejected'
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <X className="h-4 w-4 mr-1" /> Rejeitar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
