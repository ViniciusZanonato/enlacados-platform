import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssignClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    professorId: string | null; // This is the ID from institution_professors table
    institutionalProfileId: string | null;
    professorName?: string;
}

export function AssignClassModal({ isOpen, onClose, professorId, institutionalProfileId, professorName }: AssignClassModalProps) {
    const queryClient = useQueryClient();
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    // 1. Fetch all classes for this institution
    const { data: classes, isLoading: isLoadingClasses } = useQuery({
        queryKey: ['institutionClasses', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            const { data, error } = await supabase
                .from('classes')
                .select('id, name, semester, course:courses(name)')
                .eq('institution_profile_id', institutionalProfileId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionalProfileId && isOpen
    });

    // 2. Fetch currently assigned classes for this professor
    const { data: assignedClassIds, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['professorAssignments', professorId],
        queryFn: async () => {
            if (!professorId) return [];
            const { data, error } = await supabase
                .from('class_professors')
                .select('class_id')
                .eq('professor_id', professorId);

            if (error) throw error;
            return data.map((d: any) => d.class_id) || [];
        },
        enabled: !!professorId && isOpen
    });

    // Sync state when assignments load
    useEffect(() => {
        if (assignedClassIds) {
            setSelectedClasses(assignedClassIds);
        }
    }, [assignedClassIds]);

    // 3. Mutation to save changes (Sync logic: Add new, Remove unchecked)
    const saveMutation = useMutation({
        mutationFn: async (newSelection: string[]) => {
            if (!professorId) throw new Error("Professor ID missing");

            const original = assignedClassIds || [];
            const toAdd = newSelection.filter(id => !original.includes(id));
            const toRemove = original.filter(id => !newSelection.includes(id));

            // Perform updates concurrently
            const promises = [];

            if (toAdd.length > 0) {
                const rowsToAdd = toAdd.map(classId => ({
                    class_id: classId,
                    professor_id: professorId
                }));
                promises.push(supabase.from('class_professors').insert(rowsToAdd));
            }

            if (toRemove.length > 0) {
                promises.push(
                    supabase.from('class_professors')
                        .delete()
                        .eq('professor_id', professorId)
                        .in('class_id', toRemove)
                );
            }

            const results = await Promise.all(promises);
            // Check for errors in results
            results.forEach(res => {
                if (res.error) throw res.error;
            });
        },
        onSuccess: () => {
            toast.success("Atribuições atualizadas com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['professorAssignments', professorId] });
            // Optionally invalidate other queries if needed
            onClose();
        },
        onError: (error) => {
            console.error("Error saving assignments:", error);
            toast.error("Erro ao salvar atribuições.");
        }
    });

    const handleToggle = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleSave = () => {
        saveMutation.mutate(selectedClasses);
    };

    const isLoading = isLoadingClasses || isLoadingAssignments;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Atribuir Turmas</DialogTitle>
                    <DialogDescription>
                        Selecione as turmas para atribuir a <strong>{professorName || 'Professor'}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                        <div className="space-y-4">
                            {classes && classes.length > 0 ? (
                                classes.map((cls: any) => (
                                    <div key={cls.id} className="flex items-start space-x-3 space-y-0">
                                        <Checkbox
                                            id={`class-${cls.id}`}
                                            checked={selectedClasses.includes(cls.id)}
                                            onCheckedChange={() => handleToggle(cls.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={`class-${cls.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {cls.name}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {cls.course?.name} • {cls.semester || 'Sem semestre'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                    Nenhuma turma cadastrada nesta instituição.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending || isLoading}>
                        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
