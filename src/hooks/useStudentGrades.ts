import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';

export interface AssessmentGrade {
  grade_id: string;
  assessment_id: string;
  assessment_title: string;
  weight: number | null;
  due_date: string | null;
  grade: number | null;
  feedback: string | null;
  class_id: string;
  class_name: string;
  semester: string | null;
}

export interface GradesByClass {
  class_id: string;
  class_name: string;
  semester: string | null;
  assessments: AssessmentGrade[];
  average: number;
}

export const useStudentGrades = (profileId: string | undefined) => {
  return useQuery<GradesByClass[]>({
    queryKey: ['studentGrades', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('student_grades')
        .select(`
          id,
          grade,
          feedback,
          assessment_id,
          class_assessments (
            id,
            title,
            weight,
            due_date,
            class_id,
            classes (
              id,
              name,
              semester
            )
          )
        `)
        .eq('student_id', profileId);

      if (error) throw error;
      if (!data) return [];

      // Agrupa notas por turma
      const byClass = new Map<string, GradesByClass>();

      for (const row of data) {
        const assessment = row.class_assessments as {
          id: string; title: string; weight: number | null; due_date: string | null;
          class_id: string; classes: { id: string; name: string; semester: string | null } | null;
        } | null;

        if (!assessment?.classes) continue;

        const cls = assessment.classes;
        if (!byClass.has(cls.id)) {
          byClass.set(cls.id, {
            class_id: cls.id,
            class_name: cls.name,
            semester: cls.semester,
            assessments: [],
            average: 0,
          });
        }

        byClass.get(cls.id)!.assessments.push({
          grade_id: row.id,
          assessment_id: assessment.id,
          assessment_title: assessment.title,
          weight: assessment.weight,
          due_date: assessment.due_date,
          grade: row.grade,
          feedback: row.feedback,
          class_id: cls.id,
          class_name: cls.name,
          semester: cls.semester,
        });
      }

      // Calcula a média ponderada por turma (somente avaliações com nota lançada)
      const result = Array.from(byClass.values()).map(cls => {
        const graded = cls.assessments.filter(a => a.grade !== null);
        const totalWeight = graded.reduce((s, a) => s + (a.weight ?? 1), 0);
        const weighted = graded.reduce((s, a) => s + (a.grade ?? 0) * (a.weight ?? 1), 0);
        return {
          ...cls,
          average: totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) / 100 : 0,
        };
      });

      // Ordena por semestre mais recente primeiro
      return result.sort((a, b) => (b.semester ?? '').localeCompare(a.semester ?? ''));
    },
  });
};
