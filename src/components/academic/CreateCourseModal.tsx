import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    institutionalProfileId: string;
}

export function CreateCourseModal({ isOpen, onClose, institutionalProfileId }: CreateCourseModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('courses')
                .insert({
                    institutional_profile_id: institutionalProfileId,
                    name: formData.name,
                    description: formData.description
                });

            if (error) throw error;

            toast.success('Curso criado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['institutionCourses'] });
            setFormData({ name: '', description: '' });
            onClose();
        } catch (err: any) {
            toast.error(`Erro ao criar curso: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Curso</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome do Curso</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Direito, Medicina..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes sobre o curso..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Curso
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
