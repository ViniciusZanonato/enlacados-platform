import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';

// ── Tipos ────────────────────────────────────────────────────

export interface CourseLesson {
  id: string;
  title: string;
  duration: number | null;
  order_index: number | null;
  is_published: boolean | null;
  is_completed: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number | null;
  lessons: CourseLesson[];
}

export interface EnrolledCourse {
  enrollment_id: string;
  enrollment_date: string | null;
  course_id: string;
  name: string;
  description: string | null;
  category: string | null;
  cover_image: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
  modules: CourseModule[];
}

// ── Hooks ────────────────────────────────────────────────────

/**
 * Busca todos os cursos matriculados pelo aluno (profile_id),
 * incluindo a árvore de módulos/aulas e o progresso por aula.
 */
export const useStudentCourses = (profileId: string | undefined) => {
  return useQuery<EnrolledCourse[]>({
    queryKey: ['studentCourses', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];

      // Passo 1: IDs dos cursos matriculados
      const { data: enrollments, error: enrollErr } = await supabase
        .from('student_courses')
        .select('id, course_id, enrollment_date')
        .eq('profile_id', profileId);

      if (enrollErr) throw enrollErr;
      if (!enrollments || enrollments.length === 0) return [];

      const courseIds = enrollments.map(e => e.course_id);

      // Passo 2: detalhes do curso + módulos + aulas (query única via nested select do PostgREST)
      const { data: courses, error: courseErr } = await supabase
        .from('courses')
        .select(`
          id, name, description, category, cover_image,
          course_modules (
            id, title, description, order_index,
            course_lessons (
              id, title, duration, order_index, is_published
            )
          )
        `)
        .in('id', courseIds);

      if (courseErr) throw courseErr;
      if (!courses) return [];

      // Passo 3: progresso do aluno por aula
      const allLessonIds = courses.flatMap(c =>
        (c.course_modules || []).flatMap(m =>
          (m.course_lessons || []).map(l => l.id)
        )
      );

      const { data: progressData, error: progressErr } = await supabase
        .from('student_lesson_progress')
        .select('lesson_id, is_completed')
        .eq('student_id', profileId)
        .in('lesson_id', allLessonIds);

      if (progressErr) throw progressErr;

      const completedSet = new Set(
        (progressData || []).filter(p => p.is_completed).map(p => p.lesson_id)
      );

      // Passo 4: monta o objeto final com progresso calculado
      return courses.map(course => {
        const enrollment = enrollments.find(e => e.course_id === course.id)!;

        const modules: CourseModule[] = (course.course_modules || [])
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(mod => ({
            id: mod.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index,
            lessons: (mod.course_lessons || [])
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
              .map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                order_index: lesson.order_index,
                is_published: lesson.is_published,
                is_completed: completedSet.has(lesson.id),
              })),
          }));

        const total = modules.reduce((sum, m) => sum + m.lessons.length, 0);
        const completed = modules.reduce(
          (sum, m) => sum + m.lessons.filter(l => l.is_completed).length, 0
        );

        return {
          enrollment_id: enrollment.id,
          enrollment_date: enrollment.enrollment_date,
          course_id: course.id,
          name: course.name,
          description: course.description,
          category: course.category,
          cover_image: course.cover_image,
          total_lessons: total,
          completed_lessons: completed,
          progress_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
          modules,
        };
      });
    },
  });
};

/**
 * Alterna o status de conclusão de uma aula para o aluno.
 * Usa upsert para criar ou atualizar o registro de progresso.
 */
export const useToggleLessonProgress = (profileId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('student_lesson_progress')
        .upsert(
          { student_id: profileId, lesson_id: lessonId, is_completed: completed, completed_at: completed ? new Date().toISOString() : null },
          { onConflict: 'student_id,lesson_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentCourses', profileId] });
    },
  });
};
