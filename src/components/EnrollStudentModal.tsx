import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EnrollStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    institutionalProfileId: string;
}

export function EnrollStudentModal({ isOpen, onClose, studentId, institutionalProfileId }: EnrollStudentModalProps) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const { data: classes, isLoading } = useQuery({
        queryKey: ['classes', institutionalProfileId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name, semester, course_id, courses(name)')
                .eq('institution_profile_id', institutionalProfileId);

            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionalProfileId && isOpen
    });

    const handleEnroll = async () => {
        if (!selectedClassId) return;
        setIsSubmitting(true);
        try {
            // 1. Insert into class_students
            const { error: enrollError } = await supabase
                .from('class_students' as any)
                .insert({
                    class_id: selectedClassId,
                    student_id: studentId,
                    status: 'active'
                });

            if (enrollError) {
                if (enrollError.code === '23505') { // Unique violation
                    toast.error('Aluno já está matriculado nesta turma.');
                } else {
                    throw enrollError;
                }
                setIsSubmitting(false);
                return;
            }

            // 2. Sync with academic_history for the legacy/transcript view
            // We need class details
            const cls = classes?.find(c => c.id === selectedClassId);
            if (cls) {
                // @ts-ignore
                const courseName = cls.courses?.name || cls.name;

                await supabase.from('academic_history').insert({
                    student_profile_id: studentId,
                    institutional_profile_id: institutionalProfileId,
                    course_code: cls.id.substring(0, 8), // Dummy code or real if available
                    course_name: courseName,
                    semester: cls.semester || 'Atual',
                    grade: null,
                    absences: 0
                });
            }

            toast.success('Aluno matriculado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['studentJourneyHistory'] });
            onClose();
            setSelectedClassId('');
        } catch (error: any) {
            toast.error(`Erro ao matricular: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Matricular Aluno em Disciplina</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Selecione a Turma/Disciplina</label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="p-2 flex justify-center"><Loader2 className="animate-spin h-4 w-4" /></div>
                                ) : classes?.length ? (
                                    classes.map((cls: any) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.courses?.name ? `${cls.courses.name} - ` : ''}{cls.name} ({cls.semester || 'N/S'})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground">Nenhuma turma encontrada.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={handleEnroll} disabled={!selectedClassId || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Matricular
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
