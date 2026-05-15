import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ClassAttendanceTab } from '@/components/professor/ClassAttendanceTab';
import { ClassGradesTab } from '@/components/professor/ClassGradesTab';
import { ClassStudentsTab } from '@/components/professor/ClassStudentsTab';

export default function ProfessorClassManager() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();

    // Fetch Class Details
    const { data: classDetails, isLoading } = useQuery({
        queryKey: ['classDetails', classId],
        queryFn: async () => {
            if (!classId) return null;
            const { data, error } = await supabase
                .from('classes')
                .select('*, course:courses(name)')
                .eq('id', classId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!classId
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!classDetails) return <div>Turma não encontrada.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <span className="label-pill text-primary/70 block mb-0.5">Gerenciar Turma</span>
                    <h1 className="text-4xl font-black leading-none">{classDetails.name}</h1>
                    <p className="text-sm text-muted-foreground font-thin mt-1">
                        {classDetails.course?.name} • {classDetails.semester || 'Sem semestre'}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px] bg-muted/40 border border-border/50 p-1">
                    <TabsTrigger value="attendance" className="text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:text-primary">Frequência</TabsTrigger>
                    <TabsTrigger value="grades" className="text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:text-primary">Notas</TabsTrigger>
                    <TabsTrigger value="students" className="text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:text-primary">Alunos & Anotações</TabsTrigger>
                </TabsList>



                <TabsContent value="attendance" className="mt-6">
                    <ClassAttendanceTab classId={classId!} />
                </TabsContent>

                <TabsContent value="grades" className="mt-6">
                    <ClassGradesTab classId={classId!} />
                </TabsContent>

                <TabsContent value="students" className="mt-6">
                    <ClassStudentsTab classId={classId!} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
