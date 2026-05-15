import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, ChevronDown, ChevronRight, Clock, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudentCourses, useToggleLessonProgress, EnrolledCourse } from '@/hooks/useStudentCourses';

// ── Cor da barra de progresso baseada na porcentagem ────────
const progressColor = (pct: number) => {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 40) return 'text-yellow-600';
  return 'text-red-500';
};

// ── Card individual de curso com árvore expansível de módulos/aulas ──
const CourseCard = ({ course, profileId }: { course: EnrolledCourse; profileId: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const toggleLesson = useToggleLessonProgress(profileId);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) { next.delete(moduleId); } else { next.add(moduleId); }
      return next;
    });
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Cover image strip */}
      {course.cover_image && (
        <div className="h-32 w-full overflow-hidden bg-muted">
          <img src={course.cover_image} alt={course.name} className="h-full w-full object-cover" />
        </div>
      )}
      {!course.cover_image && (
        <div className="h-24 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <GraduationCap className="h-10 w-10 text-primary/40" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{course.name}</CardTitle>
          {course.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">{course.category}</Badge>
          )}
        </div>
        {course.description && (
          <CardDescription className="text-xs line-clamp-2">{course.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className={`font-semibold ${progressColor(course.progress_pct)}`}>
              {course.progress_pct}%
            </span>
          </div>
          <Progress value={course.progress_pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {course.completed_lessons} de {course.total_lessons} aulas concluídas
          </p>
        </div>

        {/* Expand/collapse modules */}
        {course.modules.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''}
            </span>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}

        {/* Module + lesson tree */}
        {expanded && (
          <div className="space-y-2 pl-1">
            {course.modules.map(mod => (
              <div key={mod.id} className="rounded-md border bg-muted/30">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors rounded-md"
                >
                  <span>{mod.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{mod.lessons.filter(l => l.is_completed).length}/{mod.lessons.length}</span>
                    {openModules.has(mod.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </span>
                </button>

                {openModules.has(mod.id) && (
                  <ul className="divide-y border-t">
                    {mod.lessons.map(lesson => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => toggleLesson.mutate({ lessonId: lesson.id, completed: !lesson.is_completed })}
                          disabled={toggleLesson.isPending}
                          className="shrink-0"
                          aria-label={lesson.is_completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                        >
                          {lesson.is_completed
                            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                            : <Circle className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                        <span className={`flex-1 text-sm ${lesson.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {lesson.title}
                        </span>
                        {lesson.duration && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {Math.round(lesson.duration / 60)}min
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main tab component ──────────────────────────────────────
interface CoursesTabProps {
  profileId: string;
}

const CoursesTab = ({ profileId }: CoursesTabProps) => {
  const { data: courses, isLoading, isError } = useStudentCourses(profileId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Não foi possível carregar seus cursos. Tente novamente mais tarde.
        </CardContent>
      </Card>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-medium">Você ainda não está matriculado em nenhum curso</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Entre em contato com sua instituição ou explore os cursos disponíveis.
        </p>
        <Button variant="outline" asChild>
          <Link to="/instituicoes">Explorar instituições</Link>
        </Button>
      </div>
    );
  }

  const totalProgress = Math.round(
    courses.reduce((sum, c) => sum + c.progress_pct, 0) / courses.length
  );

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-xs text-muted-foreground">Cursos matriculados</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {courses.reduce((s, c) => s + c.completed_lessons, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Aulas concluídas</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${progressColor(totalProgress)}`}>{totalProgress}%</p>
            <p className="text-xs text-muted-foreground">Progresso médio</p>
          </div>
        </CardContent>
      </Card>

      {/* Course grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map(course => (
          <CourseCard key={course.course_id} course={course} profileId={profileId} />
        ))}
      </div>
    </div>
  );
};

export default CoursesTab;
