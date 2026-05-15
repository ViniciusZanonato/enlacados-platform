import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, Calendar, Clock, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCourseModal } from '@/components/academic/CreateCourseModal';
import { CreateClassModal } from '@/components/academic/CreateClassModal';
import { EnrollmentRequests } from '@/components/academic/EnrollmentRequests';

export function AcademicPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);

    // Fetch Courses
    const { data: courses } = useQuery({
        queryKey: ['institutionCourses', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            const { data, error } = await supabase.from('courses').select('*').eq('institutional_profile_id', institutionalProfileId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionalProfileId,
    });

    // Fetch Classes
    const { data: classes } = useQuery({
        queryKey: ['institutionClasses', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            const { data, error } = await supabase
                .from('classes')
                .select(`
            *,
            course:courses(name)
          `)
                .eq('institution_profile_id', institutionalProfileId);

            if (error) {
                console.error(error);
                return [];
            }
            return data || [];
        },
        enabled: !!institutionalProfileId,
    });

    if (!institutionalProfileId) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Acadêmico</h2>
                    <p className="text-muted-foreground">Gestão de cursos, currículo e turmas.</p>
                </div>
            </div>

            <Tabs defaultValue="classes" className="w-full">
                <TabsList>
                    <TabsTrigger value="classes">Turmas</TabsTrigger>
                    <TabsTrigger value="courses">Cursos</TabsTrigger>
                    <TabsTrigger value="requests">Solicitações de Matrícula</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="space-y-4 pt-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">Turmas Ativas</h3>
                        <Button size="sm" onClick={() => setIsClassModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Turma</Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classes?.map((cls: any) => (
                            <Card key={cls.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{cls.name}</CardTitle>
                                    <CardDescription>{cls.course?.name} • {cls.semester}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-3 w-3" /> {cls.schedule || 'Sem horário'}</div>
                                    <div className="flex items-center text-muted-foreground"><Calendar className="mr-2 h-3 w-3" /> {cls.room || 'Sem sala'}</div>
                                </CardContent>
                            </Card>
                        ))}
                        {classes?.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhuma turma cadastrada.</p>}
                    </div>
                </TabsContent>

                <TabsContent value="courses" className="space-y-4 pt-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">Cursos Ofertados</h3>
                        <Button size="sm" onClick={() => setIsCourseModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Curso</Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {courses?.map((course: any) => (
                            <Card key={course.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />{course.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description || 'Sem descrição'}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4 pt-4">
                    <EnrollmentRequests institutionalProfileId={institutionalProfileId} />
                </TabsContent>
            </Tabs>

            <CreateCourseModal
                isOpen={isCourseModalOpen}
                onClose={() => setIsCourseModalOpen(false)}
                institutionalProfileId={institutionalProfileId}
            />

            <CreateClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                institutionalProfileId={institutionalProfileId}
                courses={courses || []}
            />
        </div >
    );
}
