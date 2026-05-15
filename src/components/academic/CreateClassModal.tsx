import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    institutionalProfileId: string;
    courses: Array<{ id: string, name: string }>;
}

export function CreateClassModal({ isOpen, onClose, institutionalProfileId, courses }: CreateClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        course_id: '',
        semester: '',
        schedule: '',
        room: ''
    });
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.course_id) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('classes')
                .insert({
                    institution_profile_id: institutionalProfileId,
                    name: formData.name,
                    course_id: formData.course_id,
                    semester: formData.semester,
                    schedule: formData.schedule,
                    room: formData.room
                });

            if (error) throw error;

            toast.success('Turma criada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['institutionClasses'] });
            setFormData({ name: '', course_id: '', semester: '', schedule: '', room: '' });
            onClose();
        } catch (err: any) {
            toast.error(`Erro ao criar turma: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Turma</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome da Turma</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Turma A - 2024.1"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Curso</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, course_id: val })} value={formData.course_id}>
                            <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                            <SelectContent>
                                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Semestre</Label>
                            <Input
                                value={formData.semester}
                                onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                placeholder="Ex: 2024.1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sala</Label>
                            <Input
                                value={formData.room}
                                onChange={e => setFormData({ ...formData, room: e.target.value })}
                                placeholder="Ex: Bloco B - 101"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                            value={formData.schedule}
                            onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                            placeholder="Ex: Seg/Qua 08:00 - 10:00"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Turma
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
