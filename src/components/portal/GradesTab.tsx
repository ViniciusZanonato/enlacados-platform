import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Award, TrendingUp, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useStudentGrades, GradesByClass } from '@/hooks/useStudentGrades';

const PASSING_GRADE = 5.0;

const gradeBadge = (grade: number | null) => {
  if (grade === null) return <Badge variant="secondary">Pendente</Badge>;
  if (grade >= PASSING_GRADE) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprovado</Badge>;
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Reprovado</Badge>;
};

const gradeColor = (grade: number | null) => {
  if (grade === null) return 'text-muted-foreground';
  if (grade >= 7) return 'text-green-600';
  if (grade >= PASSING_GRADE) return 'text-yellow-600';
  return 'text-red-500';
};

const ClassGradeCard = ({ cls }: { cls: GradesByClass }) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{cls.class_name}</CardTitle>
              {cls.semester && (
                <p className="text-xs text-muted-foreground mt-0.5">{cls.semester}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className={`text-xl font-bold ${gradeColor(cls.average)}`}>
                  {cls.average > 0 ? cls.average.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">média</p>
              </div>
              {gradeBadge(cls.average > 0 ? cls.average : null)}
              {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-2">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Avaliação</th>
                  <th className="text-center px-3 py-2 font-medium w-20">Peso</th>
                  <th className="text-center px-3 py-2 font-medium w-24">Nota</th>
                  <th className="text-right px-3 py-2 font-medium w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cls.assessments.map(a => (
                  <tr key={a.grade_id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <p className="font-medium">{a.assessment_title}</p>
                      {a.due_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {a.feedback && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">"{a.feedback}"</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {a.weight ?? '—'}
                    </td>
                    <td className={`px-3 py-2 text-center font-bold text-base ${gradeColor(a.grade)}`}>
                      {a.grade !== null ? a.grade.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {gradeBadge(a.grade)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

interface GradesTabProps {
  profileId: string;
}

const GradesTab = ({ profileId }: GradesTabProps) => {
  const { data: gradesByClass, isLoading, isError } = useStudentGrades(profileId);

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
          Não foi possível carregar suas notas. Tente novamente mais tarde.
        </CardContent>
      </Card>
    );
  }

  if (!gradesByClass || gradesByClass.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-medium">Nenhuma avaliação registrada ainda</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Suas notas aparecerão aqui conforme os professores lançarem.
        </p>
      </div>
    );
  }

  const overallAvg = gradesByClass.filter(c => c.average > 0).length > 0
    ? (gradesByClass.filter(c => c.average > 0).reduce((s, c) => s + c.average, 0) /
       gradesByClass.filter(c => c.average > 0).length)
    : 0;

  const approvedCount = gradesByClass.filter(c => c.average >= PASSING_GRADE && c.average > 0).length;
  const totalWithGrades = gradesByClass.filter(c => c.average > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>
              {overallAvg > 0 ? overallAvg.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Média geral (CR)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Turmas aprovadas</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{gradesByClass.length}</p>
            </div>
            <p className="text-xs text-muted-foreground">Turmas cursadas</p>
          </div>
        </CardContent>
      </Card>

      {/* Classes */}
      <div className="space-y-3">
        {gradesByClass.map(cls => (
          <ClassGradeCard key={cls.class_id} cls={cls} />
        ))}
      </div>
    </div>
  );
};

export default GradesTab;
