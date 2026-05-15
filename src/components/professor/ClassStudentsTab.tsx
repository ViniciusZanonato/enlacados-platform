import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Search, MoreVertical, FileText, User, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ClassStudentsTabProps {
    classId: string;
}

export function ClassStudentsTab({ classId }: ClassStudentsTabProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string, email: string, avatar: string } | null>(null);

    // Fetch Students
    const { data: students, isLoading } = useQuery({
        queryKey: ['classStudentsExtended', classId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_students')
                .select(`
                student_id,
                joined_at,
                status,
                profiles:student_id ( id, full_name, email, avatar_url )
            `)
                .eq('class_id', classId);

            if (error) throw error;
            return data.map((item: any) => ({
                id: item.student_id,
                name: item.profiles?.full_name || 'Aluno Desconhecido',
                email: item.profiles?.email,
                avatar: item.profiles?.avatar_url,
                joined_at: item.joined_at,
                status: item.status
            }))
        }
    });

    // Fetch Notes for Selected Student
    const { data: notes, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['studentNotes', selectedStudent?.id, classId],
        queryFn: async () => {
            if (!selectedStudent) return [];
            const { data, error } = await supabase
                .from('student_notes')
                .select('*')
                .eq('class_id', classId)
                .eq('student_id', selectedStudent.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedStudent
    });

    const [newNote, setNewNote] = useState('');

    const addNoteMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStudent || !newNote.trim()) return;

            // We need professor_id (current user profile id)
            // Since RLS uses auth.uid(), we can probably insert and let trigger handle it? 
            // But our table has NOT NULL professor_id.
            // We need to fetch current profile ID first or rely on a wrapper.
            // Let's fetch it quickly or assume we have it in context? 
            // Ideally we accept user_id = auth.uid() in RLS but table needs UUID.
            // Let's quick fetch our profile ID.

            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const { data: profiles } = await supabase.from('profiles').select('id').eq('user_id', user.id).limit(1);
            const profile = profiles?.[0];
            if (!profile) throw new Error("Profile not found");

            const { error } = await supabase
                .from('student_notes')
                .insert({
                    class_id: classId,
                    student_id: selectedStudent.id,
                    professor_id: profile.id,
                    note: newNote
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Anotação salva!");
            setNewNote('');
            queryClient.invalidateQueries({ queryKey: ['studentNotes'] });
        },
        onError: (err: any) => toast.error("Erro ao salvar nota: " + err.message)
    });

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[600px] gap-6">
            <div className="flex-1 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar aluno..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-2">
                    {isLoading ? (
                        <p>Carregando...</p>
                    ) : filteredStudents?.map((student) => (
                        <Card
                            key={student.id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setSelectedStudent(student)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={student.avatar} />
                                    <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{student.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedStudent?.avatar} />
                                <AvatarFallback>{selectedStudent?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {selectedStudent?.name}
                        </SheetTitle>
                        <SheetDescription>
                            Anotações privadas sobre o aluno. Visível apenas para você.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Escreva uma nova anotação..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <Button className="w-full" onClick={() => addNoteMutation.mutate()} disabled={addNoteMutation.isPending || !newNote.trim()}>
                                <Save className="mr-2 h-4 w-4" /> Salvar Anotação
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 my-2">
                            <div className="h-px bg-border flex-1" />
                            <span className="text-xs text-muted-foreground">Histórico</span>
                            <div className="h-px bg-border flex-1" />
                        </div>

                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4">
                                {isLoadingNotes ? (
                                    <p className="text-center text-sm">Carregando...</p>
                                ) : notes?.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">Nenhuma anotação registrada.</p>
                                ) : (
                                    notes?.map((note: any) => (
                                        <div key={note.id} className="bg-muted p-3 rounded-lg text-sm space-y-1">
                                            <p>{note.note}</p>
                                            <p className="text-[10px] text-muted-foreground text-right">
                                                {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
