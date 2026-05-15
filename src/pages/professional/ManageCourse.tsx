import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Loader2, Plus, ArrowLeft, MoreVertical, GripVertical, Trash2, Video, FileText, ChevronDown, ChevronUp, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

type Lesson = {
    id: string;
    module_id: string;
    title: string;
    content: string | null;
    video_url: string | null;
    duration: number | null;
    order_index: number;
    is_free_preview: boolean;
    is_published: boolean;
};

type Module = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order_index: number;
    lessons: Lesson[];
};

const ManageCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // UI State
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

    // Fetch Course Data
    const { data: courseData, isLoading } = useQuery({
        queryKey: ['manageCourse', courseId],
        queryFn: async () => {
            if (!courseId) return null;
            const { data: modules, error: modulesError } = await supabase
                .from('course_modules')
                .select('*, lessons:course_lessons(*)')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true });

            if (modulesError) throw modulesError;

            const sortedModules = modules.map((mod: any) => ({
                ...mod,
                lessons: mod.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
            }));

            const { data: course } = await supabase.from('courses').select('name, is_published').eq('id', courseId).single();
            return { course, modules: sortedModules as Module[] };
        },
        enabled: !!courseId
    });

    // Mutations
    const createModuleMutation = useMutation({
        mutationFn: async () => {
            const newOrderIndex = (courseData?.modules.length || 0);
            const { error } = await supabase.from('course_modules').insert({
                course_id: courseId,
                title: 'Novo Módulo',
                order_index: newOrderIndex
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] });
            toast.success("Módulo adicionado");
        }
    });

    const createLessonMutation = useMutation({
        mutationFn: async (moduleId: string) => {
            const module = courseData?.modules.find(m => m.id === moduleId);
            const newOrderIndex = (module?.lessons.length || 0);
            const { data, error } = await supabase.from('course_lessons').insert({
                module_id: moduleId,
                title: 'Nova Aula',
                order_index: newOrderIndex
            }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (newLesson) => {
            queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] });
            setExpandedModuleId(newLesson.module_id);
            setExpandedLessonId(newLesson.id);
            toast.success("Aula adicionada");
        }
    });

    const updateModuleMutation = useMutation({
        mutationFn: async (vars: { id: string, title: string }) => {
            const { error } = await supabase.from('course_modules').update({ title: vars.title }).eq('id', vars.id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] })
    });

    const updateLessonMutation = useMutation({
        mutationFn: async (vars: { id: string, title?: string, content?: string, is_free_preview?: boolean, video_url?: string }) => {
            const { error } = await supabase.from('course_lessons').update(vars).eq('id', vars.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Salvo");
            queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] });
        }
    });

    const updateCourseMutation = useMutation({
        mutationFn: async (vars: { is_published: boolean }) => {
            const { error } = await supabase.from('courses').update(vars).eq('id', courseId);
            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            toast.success(vars.is_published ? "Curso Publicado!" : "Curso Despublicado - Rascunho");
            queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] });
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: async ({ type, id }: { type: 'module' | 'lesson', id: string }) => {
            const table = type === 'module' ? 'course_modules' : 'course_lessons';
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Item removido");
            queryClient.invalidateQueries({ queryKey: ['manageCourse', courseId] });
        }
    });

    const handleVideoUpload = async (file: File, lessonId: string) => {
        try {
            toast.info("Iniciando upload...", { duration: 2000 });
            const fileExt = file.name.split('.').pop();
            const fileName = `${courseId}/${lessonId}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('course-videos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('course-videos').getPublicUrl(fileName);
            await updateLessonMutation.mutateAsync({ id: lessonId, video_url: publicUrl });
            toast.success("Upload concluído!");
        } catch (error: any) {
            toast.error("Erro no upload: " + error.message);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <header className="bg-background border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{courseData?.course?.name}</h1>
                        <p className="text-xs text-muted-foreground">
                            {courseData?.course?.is_published ? (
                                <span className="text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" /> Publicado</span>
                            ) : (
                                <span className="text-amber-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600" /> Rascunho</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Eye className="h-4 w-4 mr-2" /> Visualizar</Button>
                    <Button
                        onClick={() => updateCourseMutation.mutate({ is_published: !courseData?.course?.is_published })}
                        variant={courseData?.course?.is_published ? "destructive" : "default"}
                    >
                        {courseData?.course?.is_published ? 'Despublicar' : 'Publicar Curso'}
                    </Button>
                </div>
            </header>

            {/* Builder Canvas */}
            <main className="max-w-3xl mx-auto mt-8 px-4 space-y-6">
                {courseData?.modules && courseData.modules.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-background/50">
                        <p className="text-muted-foreground mb-4">Seu curso está vazio. Comece adicionando um módulo.</p>
                        <Button onClick={() => createModuleMutation.mutate()}>Adicionar Primeiro Módulo</Button>
                    </div>
                )}

                {courseData?.modules.map((module, mIndex) => (
                    <div key={module.id} className="bg-background border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Module Header */}
                        <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {mIndex + 1}
                            </span>
                            <Input
                                className="font-semibold text-lg border-transparent hover:border-input focus:border-input bg-transparent px-2 h-auto py-1"
                                defaultValue={module.title}
                                onBlur={(e) => updateModuleMutation.mutate({ id: module.id, title: e.target.value })}
                            />
                            <div className="flex-1" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteItemMutation.mutate({ type: 'module', id: module.id })}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir Módulo
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Lessons List */}
                        <div className="p-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/20">
                            {module.lessons.map((lesson, lIndex) => {
                                const isExpanded = expandedLessonId === lesson.id;
                                return (
                                    <div key={lesson.id} className={cn("border rounded-md bg-background transition-all", isExpanded ? "shadow-md ring-1 ring-primary/20" : "hover:border-primary/50")}>
                                        {/* Lesson Summarized View */}
                                        <div
                                            className="flex items-center gap-3 p-3 cursor-pointer"
                                            onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                                        >
                                            <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                                            {lesson.video_url ? <Video className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                                            <span className="font-medium text-sm flex-1">{lesson.title}</span>
                                            {lesson.is_free_preview && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Grátis</span>}
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>

                                        {/* Expanded Editor */}
                                        {isExpanded && (
                                            <div className="p-4 border-t bg-slate-50/30 dark:bg-slate-900/30 space-y-4 animate-accordion-down">
                                                <div className="space-y-1">
                                                    <Label>Título da Aula</Label>
                                                    <Input
                                                        defaultValue={lesson.title}
                                                        onBlur={(e) => updateLessonMutation.mutate({ id: lesson.id, title: e.target.value })}
                                                    />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {/* Video Upload Section */}
                                                    <div className="space-y-2">
                                                        <Label>Vídeo</Label>
                                                        {lesson.video_url ? (
                                                            <div className="relative group">
                                                                <video src={lesson.video_url} controls className="w-full rounded bg-black aspect-video" />
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => updateLessonMutation.mutate({ id: lesson.id, video_url: '' })}
                                                                >
                                                                    Substituir
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-white hover:shadow-inner transition-colors">
                                                                <Video className="h-8 w-8 text-muted-foreground/50" />
                                                                <p className="text-xs text-muted-foreground">Arraste ou clique para upload</p>
                                                                <Input
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="w-full h-full opacity-0 absolute cursor-pointer"
                                                                    onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0], lesson.id)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Settings Section */}
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Descrição</Label>
                                                            <Textarea
                                                                className="min-h-[100px] text-xs"
                                                                placeholder="Conteúdo texto..."
                                                                defaultValue={lesson.content || ''}
                                                                onBlur={(e) => updateLessonMutation.mutate({ id: lesson.id, content: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs">Preview Gratuito?</Label>
                                                            <Switch
                                                                checked={lesson.is_free_preview}
                                                                onCheckedChange={(c) => updateLessonMutation.mutate({ id: lesson.id, is_free_preview: c })}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end pt-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-7 text-xs"
                                                                onClick={() => deleteItemMutation.mutate({ type: 'lesson', id: lesson.id })}
                                                            >
                                                                Excluir Aula
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Add Lesson Button Area */}
                            <div className="px-2 pb-2">
                                <Button
                                    variant="ghost"
                                    className="w-full border border-dashed text-muted-foreground hover:text-primary hover:border-primary/50"
                                    onClick={() => createLessonMutation.mutate(module.id)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Aula
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                <Button
                    variant="outline"
                    className="w-full py-8 border-dashed text-lg font-medium text-muted-foreground hover:text-primary hover:border-primary"
                    onClick={() => createModuleMutation.mutate()}
                >
                    <Plus className="h-6 w-6 mr-2" /> Adicionar Novo Módulo
                </Button>
            </main>
        </div>
    );
};

export default ManageCoursePage;
