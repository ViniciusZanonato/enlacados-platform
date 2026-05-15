import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Upload, UserX, Send, LayoutList, Grid2X2 } from 'lucide-react';
import { toast } from 'sonner';
import StudentCard from '@/components/StudentCard';
import StudentJourneyModal from '@/components/StudentJourneyModal';
import { CreateStudentModal } from '@/components/CreateStudentModal';
import { RemoveStudentDialog } from '@/components/profile/RemoveStudentDialog';
import { MassCommunicationModal } from '@/components/MassCommunicationModal';
import { PDFReportExport } from '@/components/PDFReportExport';
import { StudentProvider } from '@/contexts/StudentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FamilyLinkRequests } from '@/components/academic/FamilyLinkRequests';
import { AcademicHistory } from '@/types/student-journey';

interface LinkedStudent {
    id: string;
    user_id: string;
    cpf: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    link_created_at: string;
    link_status: 'pending' | 'active';
    current_course_name?: string; // New explicit field
    level: number;
    xp: number;
    // Mapped fields for UI compatibility
    status: 'pending' | 'active';
    created_at: string;
}

export function StudentsPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const queryClient = useQueryClient();

    const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);
    const [studentToRemove, setStudentToRemove] = useState<LinkedStudent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isCommModalOpen, setIsCommModalOpen] = useState(false);

    // Filters
    const [nameFilter, setNameFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');

    // Queries
    const { data: courses, isLoading: isLoadingCourses } = useQuery<string[]>({
        queryKey: ['institutionalCourses', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            const { data, error } = await supabase.from('courses').select('name').eq('institutional_profile_id', institutionalProfileId);
            if (error) throw error;
            return data.map(c => c.name);
        },
        enabled: !!institutionalProfileId,
    });

    const linkedStudentsQuery = useQuery<LinkedStudent[]>({
        queryKey: ['linkedStudents', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return [];
            // Use new RPC for optimized fetching and accurate course data
            const { data, error } = await supabase.rpc('get_institution_students_with_details', {
                p_institution_profile_id: institutionalProfileId
            });

            if (error) throw error;

            return (data || []).map((student: any) => ({
                ...student,
                // RPC returns 'link_status' etc as snake case, need to map if needed or use as is.
                // The interface keys match RPC output alias.
                status: student.link_status || 'pending', // Legacy fallback for UI
                created_at: student.link_created_at, // Legacy fallback for UI
                level: 0,
                xp: 0
            }));
        },
        enabled: !!institutionalProfileId,
    });

    const filteredStudents = useMemo(() => {
        const students = linkedStudentsQuery.data || [];
        if (!nameFilter && courseFilter === 'all') return students;
        
        return students.filter(student => {
            const matchesName = !nameFilter || student.full_name.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesCourse = courseFilter === 'all' || student.current_course_name?.toLowerCase().trim() === courseFilter.toLowerCase().trim();
            return matchesName && matchesCourse;
        });
    }, [linkedStudentsQuery.data, nameFilter, courseFilter]);

    const removeStudentMutation = useMutation({
        mutationFn: async (studentProfileId: string) => {
            if (!institutionalProfileId) throw new Error("Institutional profile ID not found.");
            const { data, error } = await supabase.rpc('remove_student', { p_student_profile_id: studentProfileId, p_institution_profile_id: institutionalProfileId });
            if (error) throw error;
            if (data && !data.success) throw new Error(data.message);
            return data;
        },
        onSuccess: () => {
            toast.success('Aluno removido com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['linkedStudents'] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao remover aluno: ${error.message}`);
        }
    });

    const handleRowClick = (student: LinkedStudent) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Alunos</h2>
                    <p className="text-muted-foreground">Gerencie inscrições e perfis de alunos.</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <Button onClick={() => setIsCreateStudentModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Aluno</Button>
                    <Button asChild variant="outline"><Link to="/dashboard/upload-students"><Upload className="mr-2 h-4 w-4" /> Importar</Link></Button>
                    <PDFReportExport
                        title="Relatório de Alunos"
                        students={filteredStudents.map(s => ({ ...s, course_name: s.current_course_name || 'N/A' }))}
                    />
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="list">Lista de Alunos</TabsTrigger>
                    <TabsTrigger value="family-requests">Solicitações de Família</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                    <div className="flex flex-wrap gap-2 items-center bg-card p-4 rounded-lg border">
                        <Input
                            placeholder="Buscar por nome..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select onValueChange={setCourseFilter} value={courseFilter}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por curso" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os cursos</SelectItem>
                                {courses?.map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                                onClick={() => setIsCommModalOpen(true)}
                                disabled={filteredStudents.length === 0}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Comunicado ({filteredStudents.length})
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {linkedStudentsQuery.isLoading ? (
                            <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <StudentCard
                                    key={student.id}
                                    student={{
                                        ...student,
                                        status: student.link_status || 'pending',
                                        created_at: student.link_created_at
                                    }}
                                    onClick={() => handleRowClick(student)}
                                    onRemove={() => { setStudentToRemove(student); setIsRemoveDialogOpen(true); }}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                                <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                Nenhum aluno encontrado com os filtros atuais.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="family-requests">
                    {institutionalProfileId && <FamilyLinkRequests institutionalProfileId={institutionalProfileId} />}
                </TabsContent>
            </Tabs>

            {selectedStudent && institutionalProfileId && (
                <StudentProvider studentProfileId={selectedStudent.id} institutionalProfileId={institutionalProfileId} student={selectedStudent}>
                    <StudentJourneyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} student={selectedStudent} institutionalProfileId={institutionalProfileId} />
                </StudentProvider>
            )}

            <CreateStudentModal isOpen={isCreateStudentModalOpen} onClose={() => setIsCreateStudentModalOpen(false)} onStudentCreated={() => queryClient.invalidateQueries({ queryKey: ['linkedStudents'] })} />

            <RemoveStudentDialog
                isOpen={isRemoveDialogOpen}
                onClose={() => setIsRemoveDialogOpen(false)}
                onConfirm={() => studentToRemove && removeStudentMutation.mutate(studentToRemove.id)}
                studentName={studentToRemove?.full_name || ''}
            />

            <MassCommunicationModal
                isOpen={isCommModalOpen}
                onClose={() => setIsCommModalOpen(false)}
                recipientIds={filteredStudents.map(s => s.user_id)}
                recipientCount={filteredStudents.length}
                institutionalProfileId={institutionalProfileId || ''}
            />
        </div>
    );
}
