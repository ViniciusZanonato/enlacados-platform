import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Loader2, BookOpen, GraduationCap, Calendar, CheckCircle2, TrendingUp, TrendingDown, BookMarked } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import GradeTrendChart from '@/components/charts/GradeTrendChart';

interface ParentStudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName: string;
}

export function ParentStudentViewModal({ isOpen, onClose, studentId, studentName }: ParentStudentViewModalProps) {

  // Fetch Academic History using RLS (Family members are authorized natively now via DB)
  const { data: academicDocs, isLoading } = useQuery({
    queryKey: ['parent_academic_history', studentId],
    queryFn: async () => {
      // O Supabase PostgREST vai testar as regras do RLS. Se o pai tiver vínculo, retorna os dados da Instituição x Aluno.
      if (!studentId) return [];
      
      const { data, error } = await (supabase
        .from('academic_history')
        .select(`
           id,
           semester,
           grade,
           absences,
           academic_events ( id, name, date, type ),
           personal_courses ( id, title )
        `)
        .eq('student_cpf', studentId) // NOTE: In parent logic, we often use the student identifier directly if passed as CPF
        .order('semester', { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b bg-muted/20">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Boletim e Histórico
          </DialogTitle>
          <DialogDescription>
            Acompanhe o rendimento e a frequência de {studentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : !academicDocs || academicDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
              <BookOpen className="w-10 h-10 mb-2 opacity-50" />
              <p>O Histórico Escolar não foi divulgado pela Instituição até o momento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {academicDocs.map((history: any) => (
                <Card key={history.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-primary" />
                        {history.personal_courses?.title || 'Histórico Padrão'}
                      </CardTitle>
                      <Badge variant="outline" className="text-sm">
                        {history.year} • {history.semester}º Semestre
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b">
                      <div className="p-4 flex flex-col items-center justify-center bg-green-50/30 dark:bg-green-900/10">
                        <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Nota</span>
                        <span className={`text-3xl font-bold ${history.grade >= 7 ? 'text-green-600' : 'text-amber-500'}`}>
                          {history.grade?.toFixed(1) || '--'}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Faltas</span>
                        <span className={`text-3xl font-bold ${history.absences <= 10 ? 'text-blue-600' : 'text-red-500'}`}>
                          {history.absences ?? '--'}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Semestre</span>
                        <span className="text-lg font-bold">
                          {history.semester}
                        </span>
                      </div>
                    </div>
                    
                    {history.academic_events && history.academic_events.length > 0 && (
                      <div className="p-6">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Ocorrências Ocultas / Resumo Diário</h4>
                        <ul className="space-y-3">
                          {history.academic_events.map((ev: any) => (
                             <li key={ev.id} className="flex gap-3 items-center text-sm border-l-2 border-primary pl-3">
                                <span className="text-muted-foreground min-w-[70px] font-mono text-xs">
                                  {ev.date ? format(parseISO(ev.date), 'dd/MM/yyyy') : ''}
                                </span>
                                <span className="font-medium flex-1">{ev.name}</span>
                                <Badge variant="outline" className="text-[10px]">{ev.type}</Badge>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {/* Visual history check */}
              {academicDocs.length > 1 && academicDocs.some((doc: any) => doc.grade !== undefined) && (
                  <Card className="mt-4 border-dashed bg-muted/10">
                     <CardContent className="p-6 flex justify-center flex-col items-center text-center opacity-70">
                         <div className="h-[200px] w-full flex items-center justify-center pointer-events-none">
                            <GradeTrendChart data={academicDocs} />
                         </div>
                     </CardContent>
                  </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
