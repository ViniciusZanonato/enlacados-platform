import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, UserPlus, Check, Send } from 'lucide-react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AddProfessorModalProps {
    isOpen: boolean;
    onClose: () => void;
    institutionalProfileId: string;
}

export function AddProfessorModal({ isOpen, onClose, institutionalProfileId }: AddProfessorModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Professor');
    const queryClient = useQueryClient();

    // Search logic
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('profile_type', 'professional')
                .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err) {
            toast.error('Erro ao buscar usuários.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleInviteProfessor = async (profileId: string) => {
        setIsAdding(true);
        try {
            // Use RPC to bypass RLS complexity and handle notification atomically
            const { error } = await supabase.rpc('invite_staff_member', {
                p_institution_id: institutionalProfileId,
                p_target_profile_id: profileId,
                p_role: selectedRole
            });

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast.error('Este professor já foi convidado ou vinculado.');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Convite enviado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['institutionProfessors'] });
            onClose();
            setSearchResults([]);
            setSearchQuery('');

        } catch (err: any) {
            toast.error(`Erro ao convidar: ${err.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Convidar para a Equipe</DialogTitle>
                    <DialogDescription>
                        Envie um convite para profissionais ou administradores. Eles aparecerão como pendentes até aceitarem.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 my-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <label className="text-sm font-medium whitespace-nowrap text-muted-foreground">Atribuir Cargo:</label>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="Admin">Administrador (Total)</option>
                            <option value="Gestor">Gestor / Supervisor</option>
                            <option value="Diretor">Diretor Acadêmico</option>
                            <option value="Coordenador">Coordenador Pedagógico</option>
                            <option value="Secretaria">Secretaria Módulo</option>
                            <option value="Professor">Professor (Restrito)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                        searchResults.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={profile.avatar_url} />
                                        <AvatarFallback>{profile.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{profile.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleInviteProfessor(profile.id)} disabled={isAdding}>
                                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Convidar</>}
                                </Button>
                            </div>
                        ))
                    ) : searchQuery && !isSearching && (
                        <p className="text-center text-muted-foreground text-sm py-4">Nenhum profissional encontrado.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
