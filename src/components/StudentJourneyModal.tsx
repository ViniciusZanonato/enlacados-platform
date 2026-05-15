import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Loader2, User, BookOpen, BarChart, FileText, DollarSign, Award, Star, Mail, Phone, MapPin, Calendar, Briefcase, NotebookText, CheckCircle2, XCircle, Clock, Edit, Save } from 'lucide-react';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { AcademicHistory } from '@/types/student-journey';
import GradeTrendChart from '@/components/charts/GradeTrendChart';
import AbsenceTrendChart from '@/components/charts/AbsenceTrendChart';
import FinancialsTab from '@/components/FinancialsTab';
import DocumentsTab from '@/components/DocumentsTab';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import MentorshipNotesTab from '@/components/dashboard/MentorshipNotesTab';
import AuditLogsTab from '@/components/dashboard/AuditLogsTab';
import FamilyTab from '@/components/dashboard/FamilyTab';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { EnrollStudentModal } from '@/components/EnrollStudentModal';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

// --- Interfaces ---
interface Achievement { id: string; name: string; description: string; icon: string; }
interface PersonalProfile {
  date_of_birth: string | null;
  phone_number: string | null;
  gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | null;
  rg: string | null;
  marital_status: string | null;
  birth_city: string | null;
  nationality: string | null;
  street_address: string | null;
  neighborhood: string | null;
  current_city: string | null;
  zip_code: string | null;
  registration_number: string | null;
  current_course_id: string | null;
  current_semester: string | null;
  academic_status: 'Ativo' | 'Trancado' | 'Formando' | 'EAD' | 'Presencial' | 'Concluído' | 'Evadido' | null;
  shift: 'Matutino' | 'Noturno' | 'Integral' | 'Online' | null;
  entry_date: string | null;
  entry_method: string | null;
  gpa: number | null;
  [key: string]: unknown;
}
interface FullStudentProfile { id: string; cpf: string; full_name: string; email: string; avatar_url?: string; level: number; xp: number; }

// --- Helper Components ---
const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return 'N/A';
  try {
    const birth = parseISO(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  } catch { return 'N/A'; }
};
const ProfileInfo = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-center text-sm py-1">
    <Icon className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
    <span className="font-semibold mr-2">{label}:</span>
    <span className="text-muted-foreground break-all">{value ?? 'N/A'}</span>
  </div>
);

// --- Main Component ---
interface StudentJourneyModalProps { isOpen: boolean; onClose: () => void; student: FullStudentProfile | null; institutionalProfileId: string | null; }

const StudentJourneyModal = ({ isOpen, onClose, student, institutionalProfileId }: StudentJourneyModalProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PersonalProfile>>({});

  // --- Data Fetching ---
  const { data: fullProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['studentFullProfile', student?.id],
    queryFn: async (): Promise<FullStudentProfile | null> => {
      if (!student?.id) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', student.id).single();
      if (error) throw error;
      return data as unknown as FullStudentProfile;
    },
    enabled: !!student && isOpen,
  });

  const { data: personalProfile, isLoading: isLoadingPersonalProfile } = useQuery({
    queryKey: ['studentPersonalProfile', student?.id],
    queryFn: async (): Promise<PersonalProfile | null> => {
      if (!student?.id) return null;
      const { data, error } = await supabase.from('personal_profiles').select('*').eq('profile_id', student.id).maybeSingle();
      if (error) {
        console.error("Error fetching personal profile:", error.message);
        return null;
      }
      return data as unknown as PersonalProfile;
    },
    enabled: !!student && isOpen,
  });

  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ['studentAchievements', student?.id],
    queryFn: async (): Promise<Achievement[]> => {
      if (!student?.id) return [];
      const { data, error } = await supabase.from('user_achievements' as any).select(`
        achievements (
          id,
          name,
          description,
          icon
        )
      `).eq('profile_id', student.id);

      if (error) throw error;
      // @ts-ignore
      return data?.map((item) => item.achievements) || [];
    },
    enabled: !!student && isOpen,
  });

  const { data: coursesList } = useQuery({
    queryKey: ['coursesList', institutionalProfileId],
    queryFn: async () => {
      if (!institutionalProfileId) return [];
      const { data } = await supabase.from('courses').select('id, name').eq('institutional_profile_id', institutionalProfileId);
      return data || [];
    },
    enabled: !!institutionalProfileId && isOpen
  });


  const { data: academicHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['studentJourneyHistory', student?.id, institutionalProfileId],
    queryFn: async (): Promise<AcademicHistory[]> => {
      if (!student?.id || !institutionalProfileId) return [];
      const { data, error } = await supabase.from('academic_history').select('*').eq('student_profile_id', student.id).eq('institutional_profile_id', institutionalProfileId);
      if (error) { handleSupabaseError(error, 'Não foi possível carregar o histórico do aluno.'); throw error; }
      return (data || []) as AcademicHistory[];
    },
    enabled: !!student && !!institutionalProfileId && isOpen,
  });



  useEffect(() => {
    if (personalProfile) {
      setFormData(personalProfile);
    }
  }, [personalProfile]);

  // --- Update Mutation ---
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<PersonalProfile>) => {
      if (!student?.id) throw new Error("Student ID is missing");

      const { error } = await supabase
        .from('personal_profiles')
        .upsert({
          ...updatedData,
          profile_id: student.id
        }, { onConflict: 'profile_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil do aluno atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['studentPersonalProfile', student?.id] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Falha ao atualizar: ${error.message}`);
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (personalProfile) setFormData(personalProfile);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const { totalCoursesCount, passedCoursesCount, failedCoursesCount, totalAbsencesCount } = useMemo(() => {
    if (!academicHistory) return { totalCoursesCount: 0, passedCoursesCount: 0, failedCoursesCount: 0, totalAbsencesCount: 0 };
    const courseSet = new Set(academicHistory.map(h => h.course_name));
    const passedSet = new Set(academicHistory.filter(h => h.grade != null && h.grade >= 7).map(h => h.course_name));
    const failedSet = new Set(academicHistory.filter(h => h.grade != null && h.grade < 7).map(h => h.course_name));
    const absences = academicHistory.reduce((acc, curr) => acc + (curr.absences || 0), 0);
    return { totalCoursesCount: courseSet.size, passedCoursesCount: passedSet.size, failedCoursesCount: failedSet.size, totalAbsencesCount: absences };
  }, [academicHistory]);

  if (!student) return null;

  const profileData = fullProfile || student;
  const isLoading = isLoadingHistory || isLoadingProfile || isLoadingPersonalProfile || isLoadingAchievements;

  const renderField = (label: string, name: keyof PersonalProfile, icon: React.ElementType, type = 'text') => (
    isEditing ? (
      <div className='py-1'><label className='text-sm font-semibold'>{label}</label><Input type={type} name={name as string} value={String(formData[name] ?? '')} onChange={handleInputChange} className="h-8" /></div>
    ) : (
      <ProfileInfo icon={icon} label={label} value={personalProfile?.[name] as React.ReactNode} />
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between pr-6">
          <div>
            <DialogTitle>Jornada do Aluno: {student.full_name}</DialogTitle>
            <DialogDescription>CPF: {student.cpf} | Email: {student.email}</DialogDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={updateProfileMutation.isPending}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          )}
        </DialogHeader>
        {isLoading ? <div className="flex-grow flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div> : (
          <div className="flex-grow overflow-y-auto pr-6">
            <Tabs defaultValue="journey" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-4">
                <TabsTrigger value="journey">Jornada</TabsTrigger>
                <TabsTrigger value="academic">Acadêmico</TabsTrigger>
                <TabsTrigger value="family">Família</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="mentorship">Mentorias</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              {/* Jornada Tab */}
              <TabsContent value="journey" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><User /> Dados Pessoais</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                      <ProfileInfo icon={User} label="Nome Completo" value={profileData.full_name} />
                      <ProfileInfo icon={FileText} label="CPF" value={profileData.cpf} />
                      <ProfileInfo icon={Mail} label="Email" value={profileData.email} />
                      {renderField("RG", 'rg', FileText)}
                      <ProfileInfo icon={Calendar} label="Nascimento" value={personalProfile?.date_of_birth ? format(parseISO(personalProfile.date_of_birth), 'dd/MM/yyyy') : 'N/A'} />
                      <ProfileInfo icon={Calendar} label="Idade" value={calculateAge(personalProfile?.date_of_birth)} />
                      {isEditing ? (
                        <div className='py-1'>
                          <label className='text-sm font-semibold'>Sexo</label>
                          <Select
                            value={String(formData.gender || '')}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as any }))}
                          >
                            <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'].map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <ProfileInfo icon={User} label="Sexo" value={personalProfile?.gender} />
                      )}
                      {renderField("Telefone", 'phone_number', Phone)}
                      {renderField("Estado Civil", 'marital_status', User)}
                      {renderField("Cidade Natal", 'birth_city', MapPin)}
                      {renderField("Cidade Atual", 'current_city', MapPin)}
                      {renderField("Bairro", 'neighborhood', MapPin)}
                      {renderField("Endereço", 'street_address', MapPin)}
                      {renderField("CEP", 'zip_code', MapPin)}
                    </CardContent>
                  </Card>
                  <div className="space-y-6">
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase /> Dados Acadêmicos</CardTitle></CardHeader>
                      <CardContent className="space-y-1">
                        {renderField("RA (Matrícula)", 'registration_number', FileText)}
                        {isEditing ? (
                          <div className='py-1'>
                            <label className='text-sm font-semibold'>Curso Atual</label>
                            <Select
                              value={formData.current_course_id || ''}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, current_course_id: value }))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Selecione o curso" />
                              </SelectTrigger>
                              <SelectContent>
                                {coursesList?.map(course => (
                                  <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <ProfileInfo icon={BookOpen} label="Curso Atual" value={
                            coursesList?.find(c => c.id === personalProfile?.current_course_id)?.name || personalProfile?.current_course_id || 'N/A'
                          } />
                        )}
                        {renderField("Semestre Atual", 'current_semester', Calendar)}
                        {isEditing ? (
                          <div className='py-1'>
                            <label className='text-sm font-semibold'>Status Acadêmico</label>
                            <Select
                              value={String(formData.academic_status || '')}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, academic_status: value as any }))}
                            >
                              <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {['Ativo', 'Trancado', 'Formando', 'Concluído', 'Evadido'].map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <ProfileInfo icon={CheckCircle2} label="Status Acadêmico" value={personalProfile?.academic_status} />
                        )}
                        {isEditing ? (
                          <div className='py-1'>
                            <label className='text-sm font-semibold'>Turno</label>
                            <Select
                              value={String(formData.shift || '')}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value as any }))}
                            >
                              <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {['Matutino', 'Vespertino', 'Noturno', 'Integral', 'Online'].map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <ProfileInfo icon={Clock} label="Turno" value={personalProfile?.shift} />
                        )}
                        {renderField("Data de Ingresso", 'entry_date', Calendar, 'date')}
                        {renderField("Método de Ingresso", 'entry_method', Briefcase)}
                        {renderField("GPA", 'gpa', BarChart, 'number')}
                      </CardContent>
                    </Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star /> Nível e Progresso</CardTitle></CardHeader>
                      <CardContent className="space-y-4 text-center">
                        <p className="text-lg font-semibold">Nível {profileData.level}</p>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Progress value={(profileData.xp / ((profileData.level || 1) * 100)) * 100} /></TooltipTrigger><TooltipContent><p>{profileData.xp} / {(profileData.level || 1) * 100} XP</p></TooltipContent></Tooltip></TooltipProvider>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-4">Dashboards</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card><CardHeader><CardTitle>Evolução de Notas</CardTitle></CardHeader><CardContent className="h-80"><GradeTrendChart data={academicHistory} /></CardContent></Card>
                    <Card><CardHeader><CardTitle>Evolução de Faltas</CardTitle></CardHeader><CardContent className="h-80"><AbsenceTrendChart data={academicHistory} /></CardContent></Card>
                  </div>
                </div>
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="space-y-6">
                <h3 className="text-xl font-bold mb-4">Insights Acadêmicos Gerais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <InsightCard title="Total de Disciplinas" value={totalCoursesCount} icon={BookOpen} isLoading={isLoadingHistory} />
                  <InsightCard title="Aprov." value={passedCoursesCount} icon={CheckCircle2} isLoading={isLoadingHistory} />
                  <InsightCard title="Reprov." value={failedCoursesCount} icon={XCircle} isLoading={isLoadingHistory} />
                  <InsightCard title="Total de Faltas" value={totalAbsencesCount} icon={Clock} isLoading={isLoadingHistory} />
                </div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Histórico de Disciplinas</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setIsEnrollModalOpen(true)}>
                      <BookOpen className="mr-2 h-4 w-4" /> Nova Matrícula
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {academicHistory && academicHistory.length > 0 ? (
                      <ul className="space-y-2">
                        {academicHistory.map((item) => (
                          <li key={item.id} className="p-3 border rounded-lg text-sm">
                            <p className="font-semibold">{item.course_name} - {item.semester}</p>
                            <div className="flex justify-between">
                              <span>Nota: <span className="font-bold">{item.grade ?? 'N/A'}</span></span>
                              <span>Faltas: <span className="font-bold">{item.absences ?? 'N/A'}</span></span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-center text-muted-foreground py-8">Nenhum histórico acadêmico encontrado.</p>}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="family">
                {student.id && institutionalProfileId ? (
                  <FamilyTab studentId={student.id} institutionalProfileId={institutionalProfileId} />
                ) : (
                  <p>Dados insuficientes para carregar os vínculos.</p>
                )}
              </TabsContent>
              <TabsContent value="documents"><DocumentsTab /></TabsContent>
              <TabsContent value="financial"><FinancialsTab /></TabsContent>
              <TabsContent value="mentorship">{student.id ? <MentorshipNotesTab studentProfileId={student.id} /> : <p>ID indisponível</p>}</TabsContent>
              <TabsContent value="logs"><AuditLogsTab studentId={student.id} /></TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
      {student && institutionalProfileId && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          studentId={student.id}
          institutionalProfileId={institutionalProfileId}
        />
      )}
    </Dialog>
  );
};

export default StudentJourneyModal;