import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, BookOpen, DollarSign, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreateCourseModal } from './CreateCourseModal';

export const ProfessorCoursesTab = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    const handleEditClick = (course: any) => {
        setSelectedCourse(course);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setSelectedCourse(null);
    };

    // Fetch Professional ID first
    const { data: professionalProfile } = useQuery({
        queryKey: ['professionalProfile', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('professional_profiles')
                .select('id')
                .eq('profile_id', profile?.id)
                .single();
            return data;
        },
        enabled: !!profile?.id
    });

    const { data: courses, isLoading } = useQuery({
        queryKey: ['myMarketplaceCourses', professionalProfile?.id],
        queryFn: async () => {
            if (!professionalProfile?.id) return [];
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('professional_profile_id', professionalProfile.id);
            if (error) throw error;
            return data;
        },
        enabled: !!professionalProfile?.id
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Meus Cursos (Marketplace)</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Novo Curso
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses && courses.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-12">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Você ainda não criou nenhum curso.</p>
                            <p className="text-sm">Comece a monetizar seu conhecimento hoje mesmo!</p>
                        </div>
                    )}
                    {courses?.map((course) => (
                        <Card key={course.id}>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <Badge variant={course.is_published ? "default" : "secondary"}>
                                        {course.is_published ? 'Publicado' : 'Rascunho'}
                                    </Badge>
                                    <span className="font-bold text-green-600">
                                        R$ {course.price ?? '0.00'}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 text-lg">{course.name}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground space-y-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" /> <span>{course.category || 'Geral'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" /> <span>Visualizar Página de Vendas</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button className="w-full" onClick={() => navigate(`/portal/professional/courses/${course.id}/manage`)}>
                                    Gerenciar Conteúdo
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => handleEditClick(course)}>Editar Detalhes</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}



            <CreateCourseModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                courseToEdit={selectedCourse}
            />
        </div>
    );
};
