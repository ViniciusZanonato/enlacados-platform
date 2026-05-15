import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Mail, BookOpen, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { AddProfessorModal } from '@/components/profile/AddProfessorModal';
import { AssignClassModal } from '@/components/institution/AssignClassModal';
import { ProfessorProfileModal } from '@/components/profile/ProfessorProfileModal';
import { useQueryClient, useMutation } from '@tanstack/react-query';

export function FacultyPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState<{ id: string, name: string } | null>(null);
    const [viewProfileProfessor, setViewProfileProfessor] = useState<{ id: string, profileId: string, name: string, role: string } | null>(null);
    const queryClient = useQueryClient();

    const { data: professors, isLoading } = useQuery({
        queryKey: ['institutionProfessors', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            const { data, error } = await supabase
                .from('institution_professors')
                .select(`
            id,
            role,
            status,
            created_at,
            profile:profiles (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
                .eq('institution_profile_id', institutionalProfileId);

            if (error) {
                toast.error('Erro ao carregar professores');
                throw error;
            }
            return data || [];
        },
        enabled: !!institutionalProfileId,
    });

    const handleOpenAssignModal = (prof: any) => {
        setSelectedProfessor({
            id: prof.id,
            name: prof.profile?.full_name || 'Professor'
        });
        setIsAssignModalOpen(true);
    };

    const handleOpenProfileModal = (prof: any) => {
        setViewProfileProfessor({
            id: prof.id, // institution_professors.id
            profileId: prof.profile?.id, // public.profiles.id
            name: prof.profile?.full_name || 'Usuário',
            role: prof.role || 'Professor'
        });
        setIsProfileModalOpen(true);
    };

    const updateRoleMutation = useMutation({
        mutationFn: async ({ relId, newRole }: { relId: string, newRole: string }) => {
            const { error } = await supabase.rpc('update_staff_role', {
                p_institution_professors_id: relId,
                p_new_role: newRole
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Cargo atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['institutionProfessors'] });
        },
        onError: (err: any) => {
            toast.error('Erro ao promover usuário: ' + err.message);
        }
    });

    if (!institutionalProfileId) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Equipe e Colaboradores</h2>
                    <p className="text-muted-foreground">Gerencie sua equipe, distribuindo cargos e turmas.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Convite de Time
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Carregando...</p>
                ) : professors?.length === 0 ? (
                    <Card className="col-span-full py-8 text-center text-muted-foreground border-dashed">
                        <Users className="mx-auto h-12 w-12 opacity-50 mb-2" />
                        <p>Nenhum professor cadastrado.</p>
                        <Button variant="link" onClick={() => setIsAddModalOpen(true)}>Adicionar o primeiro</Button>
                    </Card>
                ) : (
                    professors?.map((prof: any) => (
                        <Card key={prof.id}>
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOpenProfileModal(prof)}>
                                    <AvatarImage src={prof.profile?.avatar_url} />
                                    <AvatarFallback>{prof.profile?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base cursor-pointer hover:underline" onClick={() => handleOpenProfileModal(prof)}>
                                            {prof.profile?.full_name}
                                        </CardTitle>
                                        {prof.status === 'pending' && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Pendente
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1">
                                      <select 
                                         className="h-6 text-xs bg-muted/60 border-none rounded outline-none p-1 cursor-pointer font-medium hover:bg-muted"
                                         value={prof.role}
                                         onChange={(e) => updateRoleMutation.mutate({ relId: prof.id, newRole: e.target.value })}
                                         disabled={updateRoleMutation.isPending}
                                      >
                                          <option value="Admin">Administrador (Total)</option>
                                          <option value="Gestor">Gestor</option>
                                          <option value="Diretor">Diretor</option>
                                          <option value="Coordenador">Coordenador</option>
                                          <option value="Secretaria">Secretaria</option>
                                          <option value="Professor">Professor (Aulas)</option>
                                      </select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <Mail className="mr-2 h-3 w-3" /> {prof.profile?.email}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <BookOpen className="mr-2 h-3 w-3" /> Sem turmas atribuídas
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenProfileModal(prof)}
                                    >
                                        <Eye className="mr-2 h-3 w-3" /> Ver Perfil
                                    </Button>
                                    {prof.role === 'Professor' && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1"
                                            disabled={prof.status === 'pending'}
                                            title={'Atribuir Turma'}
                                            onClick={() => handleOpenAssignModal(prof)}
                                        >
                                            Atribuir Aula
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AddProfessorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                institutionalProfileId={institutionalProfileId}
            />

            <AssignClassModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedProfessor(null);
                }}
                professorId={selectedProfessor?.id || null}
                professorName={selectedProfessor?.name}
                institutionalProfileId={institutionalProfileId}
            />

            <ProfessorProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                professorId={viewProfileProfessor?.id || null}
                profileId={viewProfileProfessor?.profileId || null}
                name={viewProfileProfessor?.name || ''}
                role={viewProfileProfessor?.role || ''}
            />
        </div>
    );
}
