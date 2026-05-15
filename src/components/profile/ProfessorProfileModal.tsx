import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, MapPin, BookOpen, User, GraduationCap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfessorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    professorId: string | null; // This is the institution_professors.id
    profileId: string | null; // This is the public.profiles.id
    name: string;
    role?: string;
}

export function ProfessorProfileModal({ isOpen, onClose, professorId, profileId, name, role }: ProfessorProfileModalProps) {

    // Fetch detailed professional profile
    const { data: professionalProfile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['professionalProfile', profileId],
        queryFn: async () => {
            if (!profileId) return null;
            const { data, error } = await supabase
                .from('professional_profiles')
                .select('*')
                .eq('profile_id', profileId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!profileId && isOpen
    });

    // Fetch assigned classes for this professor in this institution
    const { data: assignedClasses, isLoading: isLoadingClasses } = useQuery({
        queryKey: ['professorAssignedClasses', professorId],
        queryFn: async () => {
            if (!professorId) return [];
            // Join class_professors -> classes
            const { data, error } = await supabase
                .from('class_professors')
                .select(`
                    class_id,
                    classes (
                        id,
                        name,
                        semester,
                        schedule,
                        courses (name)
                    )
                `)
                .eq('professor_id', professorId);

            if (error) throw error;
            return data.map(item => item.classes) || [];
        },
        enabled: !!professorId && isOpen
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Perfil do {role && role !== 'Professor' ? 'Colaborador' : 'Professor'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 pt-0 pb-6 border-b">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-20 w-20 border-2 border-border">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
                                <AvatarFallback>{name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold">{name}</h2>
                                {professionalProfile?.title && (
                                    <p className="text-blue-600 font-medium flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" /> {professionalProfile.title}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Badge variant="secondary">{role || 'Professor'}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                <TabsTrigger value="classes">Turmas Atribuídas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <User className="h-4 w-4" /> Sobre
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Biografia</h4>
                                                <p className="text-sm leading-relaxed">
                                                    {professionalProfile?.bio || "Nenhuma biografia informada."}
                                                </p>
                                            </div>
                                            {professionalProfile?.portfolio_links && professionalProfile.portfolio_links.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Links / Portfólio</h4>
                                                    <div className="flex flex-col gap-1">
                                                        {professionalProfile.portfolio_links.map((link: string, i: number) => (
                                                            <a key={i} href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                                                                {link}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" /> Habilidades & Especialidades
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {professionalProfile?.skills && professionalProfile.skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {/* skills is string[] based on error message */}
                                                    {professionalProfile.skills.map((skill: string, i: number) => (
                                                        <Badge key={i} variant="outline">{skill}</Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Nenhuma habilidade listada.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="classes">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Turmas neste Semestre</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingClasses ? (
                                            <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6" /></div>
                                        ) : assignedClasses && assignedClasses.length > 0 ? (
                                            <div className="grid gap-4">
                                                {assignedClasses.map((cls: any) => (
                                                    <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                                        <div>
                                                            <p className="font-medium">{cls.name}</p>
                                                            <p className="text-sm text-muted-foreground">{cls.courses?.name} • {cls.semester}</p>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {cls.schedule || "Horário não def."}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhuma turma atribuída nesta instituição.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
