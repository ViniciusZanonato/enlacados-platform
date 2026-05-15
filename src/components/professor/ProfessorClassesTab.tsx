import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, Clock, BookOpen, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfessorClass {
    class_id: string;
    class_name: string;
    course_name: string;
    semester: string;
    schedule: string;
    institution_name: string;
    student_count: number;
}

export const ProfessorClassesTab = () => {
    const navigate = useNavigate();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const { data: classes, isLoading, error } = useQuery({
        queryKey: ['professorClasses'],
        queryFn: async () => {
            // Type assertion is needed because RPC returns exact shape but TS might infer generic
            const { data, error } = await supabase.rpc('get_professor_classes');
            if (error) throw error;
            return data as unknown as ProfessorClass[];
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="text-center text-red-500 p-8">Erro ao carregar turmas.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Minhas Turmas</h2>
            {classes && classes.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você não possui turmas atribuídas no momento.</p>
                </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes?.map((cls) => (
                    <Card key={cls.class_id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{cls.class_name}</CardTitle>
                            <CardDescription>{cls.course_name} • {cls.institution_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> <span>{cls.semester}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> <span>{cls.schedule || 'Horário a definir'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> <span>{cls.student_count} Alunos</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => navigate(`/portal/professional/classes/${cls.class_id}`)}>
                                <Edit className="h-4 w-4 mr-2" /> Gerenciar Diário
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};
