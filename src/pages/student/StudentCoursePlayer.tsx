import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PlayCircle, CheckCircle, Lock, ChevronLeft, Menu,
    MessageSquare, FileText, Star, Share2, MoreVertical,
    ArrowLeft, MonitorPlay, ListVideo, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

// Simple Confetti Component (Canvas based)
const Celebration = () => {
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#a855f7', '#d946ef', '#10b981', '#fbbf24'];

        for (let i = 0; i < 300; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 8 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 100
            });
        }

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.life--;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.life <= 0) particles.splice(index, 1);
            });

            if (particles.length > 0) requestAnimationFrame(animate);
            else document.body.removeChild(canvas);
        };

        animate();

        return () => {
            if (document.body.contains(canvas)) document.body.removeChild(canvas);
        };
    }, []);

    return null;
};

import { Tables } from "@/api/supabase/types";

// Define the comprehensive type for the course data
type CourseWithDetails = Tables<'courses'> & {
    professor: (Tables<'professional_profiles'> & {
        profile: Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null
    }) | null;
    modules: (Tables<'course_modules'> & {
        lessons: Tables<'course_lessons'>[];
    })[];
    reviews: { rating: number | null }[];
};

const StudentCoursePlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [activeLessonId, setActiveLessonId] = useState<string | null>(lessonId || null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [commentContent, setCommentContent] = useState("");
    const [showCelebration, setShowCelebration] = useState(false);

    // Fetch Course & Modules
    const { data: course, isLoading } = useQuery<CourseWithDetails | null>({
        queryKey: ['studentCourse', courseId],
        queryFn: async () => {
            if (!courseId) return null;
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    professor:professional_profiles(
                        title, bio,
                        profile:profiles(full_name, avatar_url)
                    ),
                    modules:course_modules(
                        *,
                        lessons:course_lessons(*)
                    ),
                    reviews:course_reviews(rating)
                `)
                .eq('id', courseId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!courseId
    });

    // Fetch Student Progress
    const { data: progress } = useQuery({
        queryKey: ['studentProgress', courseId, user?.id],
        queryFn: async () => {
            if (!user || !courseId) return [];
            const { data, error } = await supabase
                .from('student_lesson_progress')
                .select('*')
                .eq('student_id', user.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user && !!courseId
    });

    // Fetch Lesson Details (Materials & Comments)
    const { data: lessonDetails } = useQuery({
        queryKey: ['lessonDetails', activeLessonId],
        queryFn: async () => {
            if (!activeLessonId) return null;
            // Fetch Materials
            const materialsReq = supabase.from('lesson_materials').select('*').eq('lesson_id', activeLessonId);
            // Fetch Comments
            const commentsReq = supabase.from('lesson_comments').select('*, user:profiles(full_name, avatar_url)').eq('lesson_id', activeLessonId).order('created_at', { ascending: false });

            const [materials, comments] = await Promise.all([materialsReq, commentsReq]);

            return {
                materials: materials.data || [],
                comments: comments.data || []
            };
        },
        enabled: !!activeLessonId
    });

    const toggleCompletionMutation = useMutation({
        mutationFn: async (lessonId: string) => {
            if (!user) return;
            const isCompleted = progress?.some(p => p.lesson_id === lessonId && p.is_completed);
            const { error } = await supabase
                .from('student_lesson_progress')
                .upsert({
                    student_id: user.id,
                    lesson_id: lessonId,
                    is_completed: !isCompleted,
                    completed_at: !isCompleted ? new Date().toISOString() : null
                } as any, { onConflict: 'student_id, lesson_id' });

            if (error) throw error;
            return !isCompleted;
        },
        onSuccess: (newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['studentProgress'] });
            if (newStatus) {
                toast.success("Aula concluída!");
                // Check if it was the last lesson
                const allLessons = course?.modules?.flatMap((m: any) => m.lessons) || [];
                const completedCount = (progress?.filter(p => p.is_completed).length || 0) + 1;
                if (completedCount === allLessons.length) {
                    setShowCelebration(true);
                    toast.success("Parabéns! Você concluiu o curso!");
                    setTimeout(() => setShowCelebration(false), 5000);
                }
                // Auto-advance logic could go here
            }
        }
    });

    const submitCommentMutation = useMutation({
        mutationFn: async () => {
            if (!user || !activeLessonId || !commentContent.trim()) return;
            const { error } = await supabase
                .from('lesson_comments')
                .insert({
                    lesson_id: activeLessonId,
                    user_id: user.id,
                    content: commentContent
                } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            setCommentContent("");
            queryClient.invalidateQueries({ queryKey: ['lessonDetails', activeLessonId] });
            toast.success("Comentário enviado!");
        }
    });

    if (isLoading) return <div className="flex h-screen bg-background items-center justify-center"><div className="animate-spin text-primary"><MonitorPlay className="w-10 h-10" /></div></div>;
    if (!course) return <div className="h-screen bg-background text-foreground flex items-center justify-center">Curso não encontrado.</div>;

    const currentLesson = activeLessonId
        ? course.modules?.flatMap((m: any) => m.lessons).find((l: any) => l.id === activeLessonId)
        : null;

    const allLessons = course.modules?.flatMap((m: any) => m.lessons) || [];
    const completedLessonIds = new Set(progress?.filter(p => p.is_completed).map(p => p.lesson_id));
    const progressPercentage = Math.round((completedLessonIds.size / (allLessons.length || 1)) * 100);

    const handleLessonSelect = (id: string) => {
        setActiveLessonId(id);
    };

    const isCurrentLessonCompleted = activeLessonId && completedLessonIds.has(activeLessonId);

    // Initial Overview View
    if (!activeLessonId) {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
                <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/marketplace')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-semibold text-lg truncate max-w-md">{course.name}</h1>
                    </div>
                </header>

                <div className="flex-1 max-w-5xl mx-auto p-8 md:p-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                {course.category || 'Curso'}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-[1.1]">
                                {course.name}
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {course.description}
                            </p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <span>Progresso do Curso</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2 bg-secondary [&>div]:bg-primary" />
                                <p className="text-xs text-muted-foreground pt-1">{allLessons.length} conteúdos</p>
                            </div>

                            <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 uppercase tracking-widest" onClick={() => {
                                const firstLesson = course.modules?.[0]?.lessons?.[0];
                                if (firstLesson) handleLessonSelect(firstLesson.id);
                            }}>
                                {progressPercentage > 0 ? 'Continuar Curso' : 'Começar Agora'}
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {course.cover_image && (
                                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <img src={course.cover_image} alt="Course Cover" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {showCelebration && <Celebration />}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Nav */}
                <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setActiveLessonId(null)}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-semibold text-lg truncate max-w-md hidden md:block">{course.name}</h1>
                        <span className="text-muted-foreground hidden md:inline">/</span>
                        <span className="text-muted-foreground text-sm truncate max-w-xs">{currentLesson?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("text-muted-foreground transition-transform", sidebarOpen && "bg-secondary")}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <ListVideo className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <ScrollArea className="flex-1">
                    <div className="p-0 md:p-6 max-w-6xl mx-auto w-full space-y-6 pb-20">
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                            {currentLesson.video_url ? (
                                <iframe
                                    src={currentLesson.video_url}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={currentLesson.title}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <MonitorPlay className="w-16 h-16 opacity-50" />
                                    <p>Este conteúdo não possui vídeo.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {course.reviews && course.reviews.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                    {(course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                                                </span>
                                            )}
                                            <span>•</span>
                                            <span>Atualizado em {new Date(currentLesson.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className={cn("gap-2 text-white", isCurrentLessonCompleted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-secondary hover:bg-secondary/80")}
                                            size="sm"
                                            onClick={() => toggleCompletionMutation.mutate(currentLesson.id)}
                                        >
                                            <CheckCircle className={cn("w-4 h-4", isCurrentLessonCompleted ? "fill-current" : "")} />
                                            {isCurrentLessonCompleted ? "Concluída" : "Concluir Aula"}
                                        </Button>
                                    </div>
                                </div>

                                <Tabs defaultValue="comments" className="w-full">
                                    <TabsList className="bg-card border border-border text-muted-foreground">
                                        <TabsTrigger value="materials">Materiais ({lessonDetails?.materials.length || 0})</TabsTrigger>
                                        <TabsTrigger value="description">Descrição</TabsTrigger>
                                        <TabsTrigger value="comments">Comentários ({lessonDetails?.comments.length || 0})</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="materials" className="mt-4 space-y-4">
                                        {lessonDetails?.materials.length > 0 ? (
                                            lessonDetails.materials.map((material: any) => (
                                                <Card key={material.id} className="bg-card border-border text-foreground">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-8 h-8 text-primary" />
                                                            <div>
                                                                <p className="font-medium text-foreground">{material.title}</p>
                                                                <p className="text-xs text-muted-foreground uppercase">{material.file_type || 'Arquivo'}</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => window.open(material.file_url, '_blank')}>
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="p-8 bg-card/50 rounded-lg border border-dashed border-border text-sm text-center text-muted-foreground flex flex-col items-center gap-2">
                                                <FileText className="w-8 h-8 opacity-50" />
                                                Nenhum material de apoio disponível para esta aula.
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="description" className="mt-4 text-muted-foreground leading-relaxed">
                                        <div className="bg-card border border-border p-6 rounded-xl">
                                            {currentLesson.description || currentLesson.content || "Sem descrição disponível para esta aula."}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="comments" className="mt-4 space-y-6">
                                        <div className="flex gap-4">
                                            <Avatar className="w-10 h-10 border border-border">
                                                <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-2">
                                                <Textarea
                                                    placeholder="Tem alguma dúvida? Deixe um comentário."
                                                    className="bg-card border-border focus-visible:ring-primary"
                                                    value={commentContent}
                                                    onChange={(e) => setCommentContent(e.target.value)}
                                                />
                                                <div className="flex justify-end">
                                                    <Button size="sm" onClick={() => submitCommentMutation.mutate()} disabled={submitCommentMutation.isPending || !commentContent.trim()}>Publicar</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {lessonDetails?.comments.map((comment: any) => (
                                                <div key={comment.id} className="flex gap-4">
                                                    <Avatar className="w-8 h-8 border border-border">
                                                        <AvatarImage src={comment.user?.avatar_url} />
                                                        <AvatarFallback>{comment.user?.full_name?.[0] || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-sm font-bold text-foreground">{comment.user?.full_name || 'Usuário'}</span>
                                                            <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {lessonDetails?.comments.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">Seja o primeiro a comentar nesta aula!</p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Right Widget Area - Rating / Next Steps */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-xl p-6">
                                    <h3 className="font-bold text-foreground mb-2">Próxima Aula</h3>
                                    {(() => {
                                        const currentIndex = allLessons.findIndex((l: any) => l.id === activeLessonId);
                                        const nextLesson = allLessons[currentIndex + 1];
                                        return nextLesson ? (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{nextLesson.title}</p>
                                                <Button className="w-full bg-card hover:bg-secondary text-foreground border border-border" onClick={() => handleLessonSelect(nextLesson.id)}>
                                                    Ir para próxima
                                                </Button>
                                            </>
                                        ) : (
                                            <p className="text-sm text-emerald-500 font-bold">Você está na última aula!</p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Right Sidebar Playlist */}
            <div
                className={cn(
                    "w-96 bg-card border-l border-border flex flex-col transition-all duration-300 absolute right-0 top-0 bottom-0 z-20 md:relative",
                    !sidebarOpen && "translate-x-full md:mr-[-24rem]"
                )}
            >
                <div className="p-4 border-b border-border font-bold text-sm tracking-wider uppercase text-muted-foreground">
                    Conteúdo do Curso
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {course.modules?.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any) => (
                            <div key={module.id} className="space-y-2">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-2">{module.title}</h3>
                                <div className="space-y-1">
                                    {module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => {
                                        const isActive = activeLessonId === lesson.id;
                                        const isCompleted = completedLessonIds.has(lesson.id);
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => handleLessonSelect(lesson.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group",
                                                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                                                    isCompleted ? "bg-emerald-600 text-white" : (isActive ? "bg-primary text-white" : "bg-card group-hover:bg-secondary")
                                                )}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : (lesson.video_url ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                                                    <p className="text-xs opacity-60">12:30</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default StudentCoursePlayer;
