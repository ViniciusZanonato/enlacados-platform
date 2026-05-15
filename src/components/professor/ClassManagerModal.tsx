import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface StudentGrade {
    student_id: string;
    student_name: string;
    student_email: string;
    student_avatar: string;
    grade: number | null;
    absences: number | null;
    status: string;
}

interface ClassManagerModalProps {
    classId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ClassManagerModal = ({ classId, isOpen, onClose }: ClassManagerModalProps) => {
    const queryClient = useQueryClient();
    const [edits, setEdits] = useState<Record<string, { grade: string, absences: string }>>({});

    const { data: students, isLoading } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_class_students_with_grades', { p_class_id: classId });
            if (error) throw error;
            return data as StudentGrade[];
        },
        enabled: isOpen
    });

    const updateMutation = useMutation({
        mutationFn: async ({ studentId, grade, absences }: { studentId: string, grade: number, absences: number }) => {
            const { data, error } = await supabase.rpc('update_student_grade_by_professor', {
                p_class_id: classId,
                p_student_id: studentId,
                p_grade: grade,
                p_absences: absences
            });
            if (error) throw error;
            if (!data.success) throw new Error(data.message);
            return data;
        },
        onSuccess: () => {
            toast.success("Notas atualizadas com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['classStudents', classId] });
            setEdits({});
        },
        onError: (err) => {
            toast.error(`Erro ao salvar: ${err.message}`);
        }
    });

    const handleEdit = (studentId: string, field: 'grade' | 'absences', value: string) => {
        setEdits(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
                // keep the other value if not editing it, or default to current student value if not in edits
                ...(field === 'grade' ? { absences: prev[studentId]?.absences ?? students?.find(s => s.student_id === studentId)?.absences?.toString() ?? '0' } : {}),
                ...(field === 'absences' ? { grade: prev[studentId]?.grade ?? students?.find(s => s.student_id === studentId)?.grade?.toString() ?? '0' } : {})
            }
        }));
    };

    const handleSave = (studentId: string) => {
        const edit = edits[studentId];
        if (!edit) return;

        // Provide defaults if only one field was edited
        const student = students?.find(s => s.student_id === studentId);
        const gradeVal = parseFloat(edit.grade ?? student?.grade ?? 0);
        const absencesVal = parseInt(edit.absences ?? student?.absences ?? 0);

        updateMutation.mutate({ studentId, grade: gradeVal, absences: absencesVal });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciador de Diário de Classe</DialogTitle>
                    <DialogDescription>
                        Lance notas e faltas para seus alunos. As alterações são salvas individualmente.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Aluno</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24">Nota</TableHead>
                                <TableHead className="w-24">Faltas</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students?.map((student) => {
                                const isEdited = !!edits[student.student_id];
                                const currentGrade = edits[student.student_id]?.grade ?? student.grade;
                                const currentAbsences = edits[student.student_id]?.absences ?? student.absences;

                                return (
                                    <TableRow key={student.student_id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={student.student_avatar} />
                                                <AvatarFallback>{student.student_name.slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{student.student_name}</span>
                                                <span className="text-xs text-muted-foreground">{student.student_email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize">{student.status}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={currentGrade ?? ''}
                                                onChange={(e) => handleEdit(student.student_id, 'grade', e.target.value)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={currentAbsences ?? ''}
                                                onChange={(e) => handleEdit(student.student_id, 'absences', e.target.value)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {isEdited && (
                                                <Button size="icon" variant="ghost" onClick={() => handleSave(student.student_id)}>
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
};
