import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Save, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ClassGradesTabProps {
    classId: string;
}

export function ClassGradesTab({ classId }: ClassGradesTabProps) {
    const queryClient = useQueryClient();
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

    // New Assessment State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newWeight, setNewWeight] = useState('1.0');
    const [newDate, setNewDate] = useState<Date | undefined>(new Date());

    // Fetch Assessments
    const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
        queryKey: ['classAssessments', classId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_assessments')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    // Fetch Students
    const { data: students } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_students')
                .select(`
                student_id,
                profiles:student_id ( id, full_name, avatar_url )
            `)
                .eq('class_id', classId);

            if (error) throw error;
            return data.map((item: any) => ({
                student_id: item.student_id,
                name: item.profiles?.full_name || 'Aluno Desconhecido'
            }))
        }
    });

    // Fetch Grades for Selected Assessment
    const { data: gradesList, isLoading: isLoadingGrades } = useQuery({
        queryKey: ['assessmentGrades', selectedAssessmentId],
        queryFn: async () => {
            if (!selectedAssessmentId) return [];
            const { data, error } = await supabase
                .from('student_grades')
                .select('*')
                .eq('assessment_id', selectedAssessmentId);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedAssessmentId
    });

    // Local state for grades editing { studentId: { grade: string, feedback: string } }
    const [editedGrades, setEditedGrades] = useState<Record<string, { grade: string, feedback: string }>>({});

    // Initialize editedGrades
    React.useEffect(() => {
        if (gradesList) {
            const map: Record<string, { grade: string, feedback: string }> = {};
            gradesList.forEach((g: any) => {
                map[g.student_id] = { grade: String(g.grade), feedback: g.feedback || '' };
            });
            setEditedGrades(map);
        } else {
            setEditedGrades({});
        }
    }, [gradesList]);


    const createAssessmentMutation = useMutation({
        mutationFn: async () => {
            if (!newTitle) return;

            const { data, error } = await supabase
                .from('class_assessments')
                .insert({
                    class_id: classId,
                    title: newTitle,
                    weight: parseFloat(newWeight),
                    due_date: newDate ? format(newDate, 'yyyy-MM-dd') : null
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success("Avaliação criada!");
            queryClient.invalidateQueries({ queryKey: ['classAssessments'] });
            setSelectedAssessmentId(data.id);
            setIsAddModalOpen(false);
            setNewTitle('');
            setNewWeight('1.0');
        },
        onError: (err: any) => toast.error(err.message)
    });

    const saveGradesMutation = useMutation({
        mutationFn: async () => {
            if (!selectedAssessmentId) return;

            const upserts = students?.map((s: any) => {
                const entry = editedGrades[s.student_id];
                if (!entry) return null;

                const gradeVal = parseFloat(entry.grade);
                if (isNaN(gradeVal)) return null;

                return {
                    assessment_id: selectedAssessmentId,
                    student_id: s.student_id,
                    grade: gradeVal,
                    feedback: entry.feedback
                };
            }).filter(Boolean) || [];

            if (upserts.length === 0) return;

            const { error } = await supabase
                .from('student_grades')
                .upsert(upserts, { onConflict: 'assessment_id, student_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Notas salvas com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['assessmentGrades'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleGradeChange = (studentId: string, field: 'grade' | 'feedback', value: string) => {
        setEditedGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const currentAssessment = assessments?.find(a => a.id === selectedAssessmentId);

    return (
        <div className="flex gap-6 h-[600px] border rounded-lg bg-background p-4">
            {/* Sidebar: Assessments List */}
            <div className="w-1/3 border-r pr-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Avaliações</h3>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Avaliação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Título (ex: Prova 1)</Label>
                                    <Input
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Nome da avaliação"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Peso</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={newWeight}
                                        onChange={e => setNewWeight(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Entrega / Aplicação</Label>
                                    <div className="border rounded p-2">
                                        <Calendar
                                            mode="single"
                                            selected={newDate}
                                            onSelect={setNewDate}
                                            className="rounded-md"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => createAssessmentMutation.mutate()} disabled={createAssessmentMutation.isPending}>
                                    {createAssessmentMutation.isPending ? "Criando..." : "Criar Avaliação"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {isLoadingAssessments ? (
                        <p className="text-sm p-4 text-center">Carregando...</p>
                    ) : assessments?.map((assessment: any) => (
                        <div
                            key={assessment.id}
                            onClick={() => setSelectedAssessmentId(assessment.id)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors flex justify-between items-center",
                                selectedAssessmentId === assessment.id ? "bg-accent border-primary" : "bg-card"
                            )}
                        >
                            <div>
                                <span className="font-bold flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    {assessment.title}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {assessment.due_date ? format(new Date(assessment.due_date), 'dd/MM/yyyy') : 'Sem data'} • Peso: {assessment.weight}
                                </p>
                            </div>
                        </div>
                    ))}
                    {assessments?.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground p-4">Nenhuma avaliação criada.</p>
                    )}
                </div>
            </div>

            {/* Main: Grades Table */}
            <div className="flex-1 flex flex-col">
                {selectedAssessmentId ? (
                    <>
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">{currentAssessment?.title}</h2>
                                <p className="text-muted-foreground text-sm">
                                    Peso: {currentAssessment?.weight} • Data: {currentAssessment?.due_date ? format(new Date(currentAssessment.due_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                            <Button onClick={() => saveGradesMutation.mutate()} disabled={saveGradesMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Notas
                            </Button>
                        </div>

                        <div className="border rounded-md flex-1 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead className="w-[120px]">Nota (0-100)</TableHead>
                                        <TableHead>Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students?.map((student: any) => {
                                        const entry = editedGrades[student.student_id] || { grade: '', feedback: '' };
                                        return (
                                            <TableRow key={student.student_id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-20"
                                                        value={entry.grade}
                                                        onChange={e => handleGradeChange(student.student_id, 'grade', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Comentário opcional..."
                                                        value={entry.feedback}
                                                        onChange={e => handleGradeChange(student.student_id, 'feedback', e.target.value)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>Selecione uma avaliação para lançar notas.</p>
                        <p className="text-sm">Ou clique em "+" para criar uma nova avaliação.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
