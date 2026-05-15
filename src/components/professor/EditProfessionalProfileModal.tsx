import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfessionalProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalProfile: any;
    profileId: string | undefined;
}

export const EditProfessionalProfileModal = ({ isOpen, onClose, professionalProfile, profileId }: EditProfessionalProfileModalProps) => {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        title: '',
        bio: '',
        specialization: ''
    });

    useEffect(() => {
        if (professionalProfile) {
            setForm({
                title: professionalProfile.title || '',
                bio: professionalProfile.bio || '',
                specialization: professionalProfile.specialization || ''
            });
        }
    }, [professionalProfile]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!profileId) throw new Error("Profile ID missing");

            const updates: any = {
                title: form.title,
                bio: form.bio,
                specialization: form.specialization,
                updated_at: new Date().toISOString()
            };

            // Generate invite code if it doesn't exist
            if (!professionalProfile?.invite_code) {
                // Simple random code: PROF-XXXX
                const randomCode = 'PROF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                updates.invite_code = randomCode;
            }

            // Check if professional_profile exists, if not create one?
            // Usually it exists if we are here, but for safety:
            const { error } = await supabase
                .from('professional_profiles')
                .update(updates)
                .eq('profile_id', profileId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Perfil atualizado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['professionalProfile', profileId] });
            onClose();
        },
        onError: (err) => {
            toast.error("Erro ao atualizar perfil: " + err.message);
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Perfil Profissional</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Título Profissional</Label>
                        <Input
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Ex: Professor de Matemática, Advogado Civil..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Especialização</Label>
                        <Input
                            value={form.specialization}
                            onChange={e => setForm({ ...form, specialization: e.target.value })}
                            placeholder="Ex: Direito Processual, Cálculo III"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Biografia</Label>
                        <Textarea
                            value={form.bio}
                            onChange={e => setForm({ ...form, bio: e.target.value })}
                            placeholder="Conte um pouco sobre sua experiência e metodologia de ensino..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
