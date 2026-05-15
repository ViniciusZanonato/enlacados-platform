import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Users, DollarSign, Loader2, Copy, Check, User, BookOpen, GraduationCap, LayoutDashboard, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProfileViewsChart from '@/components/charts/ProfileViewsChart';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProfessorClassesTab } from '@/components/professor/ProfessorClassesTab';
import { ProfessorCoursesTab } from '@/components/professor/ProfessorCoursesTab';
import { LinkedInstitutionsCard } from '@/components/professor/LinkedInstitutionsCard';
import { EditProfessionalProfileModal } from '@/components/professor/EditProfessionalProfileModal';
import { MentoringDashboard } from '@/components/professor/MentoringDashboard';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
  colorClass?: string;
}

const KpiCard = ({ title, value, icon: Icon, isLoading, colorClass }: KpiCardProps) => (
  <Card className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elegant hover:-translate-y-0.5">
    <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/30 group-hover:bg-primary/70 transition-colors duration-300" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
      <CardTitle className="text-xs font-thin tracking-widest uppercase text-muted-foreground">{title}</CardTitle>
      <div className={cn("h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center", colorClass)}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent className="pl-5">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="text-3xl font-black tracking-tight text-foreground">{value}</div>
      )}
    </CardContent>
  </Card>
);

const ProfessorPortal = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: kpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['professorKpis', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase.rpc('get_professor_kpis');
      if (error) throw error;
      return data as {
        active_classes: number;
        total_students: number;
        marketplace_courses: number;
        total_sales: number;
      };
    },
    enabled: !!profile?.id
  });

  const { data: professionalProfile, isLoading: isLoadingProfessionalProfile } = useQuery({
    queryKey: ['professionalProfile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const handleCopy = async () => {
    const inviteCode = professionalProfile?.invite_code;
    if (!inviteCode) return;

    if (!navigator.clipboard) {
      toast.error("A funcionalidade de copiar não é suportada neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success("Código copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Falha ao copiar o código.");
    }
  };

  const currentTab = location.pathname.split('/').pop();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-10 stagger-1" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
        <span className="label-pill text-primary/70 block mb-1">Portal do Profissional</span>
        <h1 className="text-5xl leading-none">Meu Espaço</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* --- Left Sidebar --- */}
        <div className="md:col-span-1 space-y-6">
          <Card className="relative overflow-hidden border-border/50">
            <div className="absolute inset-0 pointer-events-none opacity-40"
              style={{ background: 'radial-gradient(ellipse at top left, hsl(270 80% 55% / 0.12) 0%, transparent 65%)' }} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="flex items-center gap-2 text-sm font-thin tracking-widest uppercase text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Perfil
              </CardTitle>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditProfileModalOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="flex flex-col items-center mb-4">
                <img
                  src={profile?.avatar_url || 'https://github.com/shadcn.png'}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full mb-3 object-cover ring-2 ring-primary/20"
                />
                <h3 className="text-lg font-black leading-tight">{professionalProfile?.title || profile?.full_name}</h3>
                <span className="label-pill text-muted-foreground mt-1">{user?.email}</span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Bio</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {professionalProfile?.bio || 'Adicione uma biografia para atrair mais alunos.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-thin tracking-widest uppercase text-muted-foreground mb-2">Código de Convite</p>
                <div className="flex items-center justify-between bg-muted/60 p-2.5 rounded-lg border border-border/50">
                  <span className="font-mono text-sm font-black tracking-wider">{professionalProfile?.invite_code || 'N/A'}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <LinkedInstitutionsCard />

          <Card className="relative overflow-hidden border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-thin tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-thin tracking-widest uppercase text-muted-foreground mb-1">Saldo Disponível</p>
                  <p className="text-3xl font-black tracking-tight text-green-500">
                    R$ {kpis?.total_sales ? Number(kpis.total_sales).toFixed(2) : '0.00'}
                  </p>
                </div>
                <Button className="w-full" variant="outline" onClick={() => toast.info("Funcionalidade de Extrato em breve!")}>
                  Ver Extrato
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Main Content --- */}
        <div className="md:col-span-2">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto mb-6 bg-muted/40 border border-border/50 p-1">
              <TabsTrigger value="dashboard" className="gap-2 text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:tracking-tight data-[state=active]:text-primary">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2 text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:tracking-tight data-[state=active]:text-primary">
                <BookOpen className="h-3.5 w-3.5" /> Turmas
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2 text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:tracking-tight data-[state=active]:text-primary">
                <GraduationCap className="h-3.5 w-3.5" /> Marketplace
              </TabsTrigger>
              <TabsTrigger value="agenda" className="gap-2 text-xs font-thin tracking-wide uppercase data-[state=active]:font-black data-[state=active]:tracking-tight data-[state=active]:text-primary">
                <Calendar className="h-3.5 w-3.5" /> Agenda
              </TabsTrigger>
              <TabsTrigger value="blog" asChild>
                <Link to="/portal/professional/blog" className={cn("gap-2 flex items-center justify-center text-xs font-thin tracking-wide uppercase", { "bg-background font-black tracking-tight text-primary shadow-sm": currentTab === "blog" })}>
                  <Eye className="h-3.5 w-3.5" /> Blog
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Alunos Ativos" value={kpis?.total_students || 0} icon={Users} isLoading={isLoadingKpis} />
                <KpiCard title="Turmas em Andamento" value={kpis?.active_classes || 0} icon={BookOpen} isLoading={isLoadingKpis} />
                <KpiCard title="Cursos Publicados" value={kpis?.marketplace_courses || 0} icon={GraduationCap} isLoading={isLoadingKpis} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileViewsChart profileId={profile?.id} />
                <Card className="border-border/50">
                  <CardHeader>
                    <span className="label-pill text-primary/70 block mb-1">Marketplace</span>
                    <CardTitle className="text-xl font-black leading-tight">Vendas Recentes</CardTitle>
                    <CardDescription className="font-thin">Últimas matrículas no marketplace.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[160px] text-muted-foreground text-sm font-thin tracking-wide">
                    Nenhuma venda registrada recentemente.
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="classes">
              <ProfessorClassesTab />
            </TabsContent>

            <TabsContent value="courses">
              <ProfessorCoursesTab />
            </TabsContent>

            <TabsContent value="agenda">
              <MentoringDashboard />
            </TabsContent>

            <TabsContent value="blog">
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EditProfessionalProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        professionalProfile={professionalProfile}
        profileId={profile?.id}
      />
    </div>
  );
};

export default ProfessorPortal;