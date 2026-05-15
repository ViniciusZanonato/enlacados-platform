import React, { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, BookOpen, Award, Star, Building, FileText, DollarSign, BarChart, BarChart3, Mail, Phone, MapPin, Calendar, ShieldAlert } from 'lucide-react';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GradeSimulatorTab from '@/components/GradeSimulatorTab';
import GradeTrendChart from '@/components/charts/GradeTrendChart';
import { AcademicHistory } from '@/types/student-journey';
import FinancialsTab from '@/components/FinancialsTab';
import DocumentsTab from '@/components/DocumentsTab';
import StudentSelfEnrollmentTab from '@/components/portal/StudentSelfEnrollmentTab';
import CoursesTab from '@/components/portal/CoursesTab';
import GradesTab from '@/components/portal/GradesTab';
import { format } from 'date-fns';
import { StudentProvider } from '@/contexts/StudentContext';
import { Navigate, Link } from 'react-router-dom';
import { Database } from '@/api/supabase/types';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface LinkedInstitution {
  id: string;
  institution_name: string;
}

type PersonalProfileRow = Database['public']['Tables']['personal_profiles']['Row'];

interface PersonalProfile extends PersonalProfileRow {
  date_of_birth: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  } | null;
  registration_number: string | null;
  current_course_id: string | null;
  current_semester: string | null;
  academic_status: 'Ativo' | 'Trancado' | 'Formando' | 'EAD' | 'Presencial' | 'Concluído' | 'Evadido' | null;
  shift: 'Matutino' | 'Noturno' | 'Integral' | 'Online' | null;
  entry_date: string | null;
  entry_method: string | null;
  gpa: number | null;
  phone_number: string | null;
  gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  rg: string | null;
  rne: string | null;
  passport: string | null;
  status_tags: string[] | null;
}

interface Professor {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  attendance_hours: { [key: string]: string } | null;
}

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return 'N/A';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age.toString();
};

const ProfileInfo = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null | undefined }) => (
  <div className="flex items-center text-sm">
    <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
    <span className="font-semibold mr-2">{label}:</span>
    <span className="text-muted-foreground">{value || 'N/A'}</span>
  </div>
);

const StudentPortal = () => {
  const { user, profile } = useAuth();
  const [linkingCode, setLinkingCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('all');

  const { data: academicHistory, isLoading: loadingHistory } = useQuery<AcademicHistory[]>({
    queryKey: ['academicHistory', profile?.id, selectedInstitutionId],
    queryFn: async () => {
      if (!profile || !profile.profile_type?.includes('personal')) return [];

      let query = supabase
        .from('academic_history')
        .select('*')
        .eq('student_profile_id', profile.id);

      if (selectedInstitutionId !== 'all') {
        query = query.eq('institutional_profile_id', selectedInstitutionId);
      }

      const { data, error } = await query;
      if (error) {
        handleSupabaseError(error, 'Não foi possível carregar o histórico acadêmico.');
        throw error;
      }
      return data || [];
    },
    enabled: !!profile,
  });

  const { data: achievements, isLoading: loadingAchievements } = useQuery<Achievement[]>({
    queryKey: ['userAchievements', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievements(*)')
        .eq('profile_id', profile.id);
      if (error) throw error;
      return data.map((item: { achievements: Achievement }) => item.achievements);
    },
    enabled: !!profile,
  });

  const { data: personalProfile, isLoading: loadingPersonalProfile } = useQuery<PersonalProfile | null>({
    queryKey: ['personalProfile', profile?.id],
    queryFn: async () => {
      if (!profile || !profile.profile_type?.includes('personal')) return null;
      const { data, error } = await supabase
        .from('personal_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      if (error) throw error;

      // Polyfill for missing fields that exist in interface but not in DB
      return {
        ...data,
        registration_number: null,
        current_course_id: null,
        current_semester: null,
        academic_status: null,
        shift: null,
        entry_date: null,
        entry_method: null,
        gpa: null,
        status_tags: null
      } as PersonalProfile;
    },
    enabled: !!profile && profile.profile_type?.includes('personal'),
  });

  const { data: professors, isLoading: loadingProfessors } = useQuery<Professor[]>({
    queryKey: ['studentProfessors', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase.rpc('get_student_professors', { p_student_profile_id: profile.id });
      if (error) throw error;

      // Fix for attendance_hours type mismatch
      return (data || []).map(prof => ({
        ...prof,
        attendance_hours: prof.attendance_hours as { [key: string]: string } | null
      }));
    },
    enabled: !!profile,
  });

  const linkedInstitutionsQuery = useQuery<LinkedInstitution[]>({
    queryKey: ['linkedInstitutions', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data: links, error: linksError } = await supabase
        .from('institution_students')
        .select('institution_profile_id')
        .eq('student_profile_id', profile.id)
        .eq('status', 'active');
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];
      const institutionIds = links.map(link => link.institution_profile_id);
      const { data: institutions, error: instError } = await supabase
        .from('institutional_profiles')
        .select('id, institution_name')
        .in('id', institutionIds);
      if (instError) throw instError;
      return institutions || [];
    },
    enabled: !!profile,
  });

  const institutionIds = (linkedInstitutionsQuery.data || []).map(i => i.id);
  const { data: hasActiveCPA } = useQuery({
    queryKey: ['hasActiveCPA', institutionIds],
    queryFn: async () => {
      const { count } = await supabase
        .from('questionnaires')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('institution_id', institutionIds);
      return (count ?? 0) > 0;
    },
    enabled: institutionIds.length > 0,
  });

  const handleLinkToInstitution = async () => {
    if (!linkingCode) {
      toast.error('Por favor, insira um código de vinculação.');
      return;
    }
    setIsLinking(true);
    try {
      const { error } = await supabase.rpc('link_student_to_institution', {
        p_linking_code: linkingCode,
      });
      if (error) throw error;
      toast.success('Você foi vinculado à instituição com sucesso!');
      linkedInstitutionsQuery.refetch();
    } catch (error: unknown) {
      handleSupabaseError(error, 'Não foi possível vincular à instituição.');
    } finally {
      setIsLinking(false);
      setLinkingCode('');
    }
  };

  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpProgress = profile ? (profile.xp / xpForNextLevel) * 100 : 0;
  const selectedInstitutionName = selectedInstitutionId === 'all'
    ? 'Todas as Instituições'
    : linkedInstitutionsQuery.data?.find(inst => inst.id === selectedInstitutionId)?.institution_name;

  const averageGrade = (academicHistory || []).reduce((acc, curr) => acc + (curr.grade || 0), 0) / ((academicHistory || []).length || 1);

  // Percentage of subjects with grade >= 5.0 (passing grade in most Brazilian universities)
  const PASSING_GRADE = 5.0;
  const passedSubjects = (academicHistory || []).filter(h => (h.grade || 0) >= PASSING_GRADE).length;
  const totalSubjects = (academicHistory || []).length;
  const courseCompletionPercentage = totalSubjects > 0 ? Math.round((passedSubjects / totalSubjects) * 100) : 0;

  // Rank among all personal profiles by XP (position = count of profiles with more XP + 1)
  const { data: rankData } = useQuery({
    queryKey: ['studentRank', profile?.xp],
    queryFn: async () => {
      if (!profile) return null;
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('profile_type', 'personal')
        .gt('xp', profile.xp);
      return (count ?? 0) + 1;
    },
    enabled: !!profile,
  });
  const studentRank = rankData ?? profile?.level ?? 0;

  if (loadingHistory || loadingAchievements || linkedInstitutionsQuery.isLoading || loadingPersonalProfile || loadingProfessors) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!profile) {
    return <div className="text-center py-12">Você precisa estar logado para ver esta página.</div>;
  }

  // RoleRoute already blocks non-personal users at the router level,
  // but this guard provides defense-in-depth if the component is used directly.
  if (!profile.profile_type?.includes('personal')) {
    return <Navigate to="/portal" replace />;
  }

  const isSkippedOnboarding = profile.verification_status === 'skipped';

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <span className="label-pill text-primary/70 block mb-2">Área do estudante</span>
        <h1 className="text-5xl leading-none">Portal do Aluno</h1>
      </div>

      {isSkippedOnboarding && (
        <Card className="mb-8 border-yellow-500 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <ShieldAlert className="h-5 w-5" /> Conta com Acesso Limitado
            </CardTitle>
            <CardDescription className="text-yellow-700/80">
              Você pulou a configuração inicial do seu perfil. Para liberar todos os recursos e ser verificado, complete seu onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Link to="/portal/setup">Completar Configuração Agora</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* --- Left Sidebar --- */}
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User /> Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Nome:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>CPF:</strong> {profile.cpf}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building /> Vincular à Instituição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira o código de vinculação fornecido pela sua instituição de ensino.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Código de Vinculação"
                  value={linkingCode}
                  onChange={(e) => setLinkingCode(e.target.value)}
                />
                <Button onClick={handleLinkToInstitution} disabled={isLinking}>
                  {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vincular'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Main Content --- */}
        <div className="md:col-span-2">
          {/* Global Institution Filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building /> Instituição Selecionada</CardTitle>
              <CardDescription>Selecione uma instituição para visualizar os dados específicos dela.</CardDescription>
            </CardHeader>
            <CardContent>
              {linkedInstitutionsQuery.data && linkedInstitutionsQuery.data.length > 0 ? (
                <Select onValueChange={setSelectedInstitutionId} value={selectedInstitutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instituição..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Instituições</SelectItem>
                    {linkedInstitutionsQuery.data.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.institution_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground">Você não está vinculado a nenhuma instituição ativa.</p>
              )}
            </CardContent>
          </Card>
          <Tabs defaultValue="journey" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 h-auto">
              <TabsTrigger value="journey">Minha Jornada</TabsTrigger>
              <TabsTrigger value="courses">Cursos</TabsTrigger>
              <TabsTrigger value="grades">Notas</TabsTrigger>
              <TabsTrigger value="academic">Acadêmico</TabsTrigger>
              <TabsTrigger value="simulator">Simulador</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="enrollment">Rematrícula</TabsTrigger>
              <TabsTrigger value="professors">Professores</TabsTrigger>
            </TabsList>

            {/* Minha Jornada Tab */}
            <TabsContent value="journey" className="mt-6 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User /> Dados Pessoais</CardTitle>
                  <CardDescription>Informações básicas do seu perfil.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProfileInfo icon={User} label="Nome Completo" value={profile.full_name} />
                  <ProfileInfo icon={FileText} label="CPF" value={profile.cpf} />
                  {user?.email && <ProfileInfo icon={Mail} label="Email" value={user.email} />}
                  {personalProfile?.rg && <ProfileInfo icon={FileText} label="RG" value={personalProfile.rg} />}
                  {personalProfile?.rne && <ProfileInfo icon={FileText} label="RNE" value={personalProfile.rne} />}
                  {personalProfile?.passport && <ProfileInfo icon={FileText} label="Passaporte" value={personalProfile.passport} />}
                  <ProfileInfo
                    icon={Calendar}
                    label="Nascimento"
                    value={personalProfile?.date_of_birth ? format(new Date(personalProfile.date_of_birth), 'dd/MM/yyyy') : 'N/A'}
                  />
                  <ProfileInfo
                    icon={Calendar}
                    label="Idade"
                    value={calculateAge(personalProfile?.date_of_birth)}
                  />
                  {personalProfile?.gender && <ProfileInfo icon={User} label="Sexo" value={personalProfile.gender} />}
                  {personalProfile?.phone_number && <ProfileInfo icon={Phone} label="Telefone" value={personalProfile.phone_number} />}
                  {personalProfile?.emergency_contact_name && <ProfileInfo icon={User} label="Contato Emerg." value={`${personalProfile.emergency_contact_name} (${personalProfile.emergency_contact_phone || 'N/A'})`} />}
                  {personalProfile?.address && (
                    <ProfileInfo
                      icon={MapPin}
                      label="Endereço"
                      value={`${personalProfile.address.street || ''}, ${personalProfile.address.city || ''}, ${personalProfile.address.state || ''} ${personalProfile.address.postal_code || ''}`.trim().replace(/, $/, '') || 'N/A'}
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Star /> Nível e Progresso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold">Nível {profile.level}</p>
                    <Progress value={xpProgress} className="w-full mt-2" />
                    <p className="text-sm text-muted-foreground mt-1">{profile.xp} / {xpForNextLevel} XP</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award /> Conquistas</CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements && achievements.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {achievements.map(ach => (
                        <Tooltip key={ach.id}>
                          <TooltipTrigger>
                            <div className="text-4xl p-2 bg-muted rounded-lg">{ach.icon}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{ach.name}</p>
                            <p>{ach.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma conquista ainda. Continue progredindo!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cursos Tab */}
            <TabsContent value="courses" className="mt-6">
              {hasActiveCPA && (
                <div className="flex items-center justify-between rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-violet-300">Avaliação Institucional aberta</p>
                      <p className="text-xs text-violet-400/80">Sua instituição quer ouvir você. Leva menos de 5 minutos.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-violet-500/50 text-violet-300 hover:bg-violet-500/10" asChild>
                    <Link to="/portal/cpa">Responder →</Link>
                  </Button>
                </div>
              )}
              <CoursesTab profileId={profile.id} />
            </TabsContent>

            {/* Notas Tab */}
            <TabsContent value="grades" className="mt-6">
              <GradesTab profileId={profile.id} />
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="mt-6 space-y-8">
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                {[
                  { title: 'Média Geral (CR)', value: averageGrade.toFixed(2), desc: 'Média de todas as disciplinas cursadas' },
                  { title: 'Progresso do Curso', value: `${courseCompletionPercentage}%`, desc: `${passedSubjects} de ${totalSubjects} disciplinas aprovadas` },
                  { title: 'Posição no Ranking', value: `#${studentRank}`, desc: 'Entre todos os alunos por XP acumulado' },
                ].map(({ title, value, desc }) => (
                  <Card key={title} className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elegant hover:-translate-y-0.5">
                    <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/30 group-hover:bg-primary/70 transition-colors" />
                    <CardHeader className="pl-5 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-5">
                      <div className="text-3xl font-black tracking-tight">{value}</div>
                      <p className="text-xs text-muted-foreground font-light mt-1">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {academicHistory && academicHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart /> Desempenho Geral</CardTitle>
                    <CardDescription>Evolução das suas notas ao longo dos semestres.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GradeTrendChart data={academicHistory} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><BookOpen /> Histórico Acadêmico</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Exibindo de: <strong>{selectedInstitutionName}</strong>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : academicHistory && academicHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {academicHistory.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{item.course_name}</p>
                            <p className="label-pill text-muted-foreground">{item.semester}</p>
                          </div>
                          <div className="flex gap-5 text-sm shrink-0">
                            <span className="text-center">
                              <span className="block font-black text-foreground">{item.grade ?? '—'}</span>
                              <span className="label-pill text-muted-foreground">nota</span>
                            </span>
                            <span className="text-center">
                              <span className="block font-black text-foreground">{item.absences ?? '—'}</span>
                              <span className="label-pill text-muted-foreground">faltas</span>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nenhum histórico acadêmico encontrado para a seleção atual.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Simulator Tab */}
            <TabsContent value="simulator" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart /> Simulador de Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <GradeSimulatorTab />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              {profile?.cpf && <DocumentsTab />}
              {!profile?.cpf && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Meus Documentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      <p>CPF do aluno não disponível para carregar documentos.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="mt-6">
              {profile?.cpf && <FinancialsTab />}
              {!profile?.cpf && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      <p>CPF do aluno não disponível para carregar dados financeiros.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Professors Tab */}
            <TabsContent value="professors" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User /> Meus Professores</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {professors && professors.length > 0 ? (
                    professors.map(prof => (
                      <div key={prof.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200">
                        <Avatar className="h-11 w-11 ring-2 ring-primary/15">
                          <AvatarImage src={prof.avatar_url ?? undefined} />
                          <AvatarFallback className="font-black text-sm bg-primary/10 text-primary">{prof.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{prof.name}</p>
                          <p className="text-xs text-muted-foreground font-light truncate">{prof.email}</p>
                          {prof.attendance_hours && (
                            <p className="label-pill text-muted-foreground mt-0.5 truncate">
                              {Object.entries(prof.attendance_hours).map(([day, hours]) => `${day}: ${hours}`).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-muted-foreground py-8 font-light">Nenhum professor encontrado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="enrollment" className="mt-6">
              <StudentSelfEnrollmentTab institutionId={selectedInstitutionId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
