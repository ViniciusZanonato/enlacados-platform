import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Loader2, Users, School, Clock, CheckCircle2, ChevronRight, FileText, UserCircle, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParentStudentViewModal } from '@/components/family/ParentStudentViewModal';
import { AddDependentDialog } from '@/components/family/AddDependentDialog';
import { UserPlus } from 'lucide-react';
import GradeTrendChart from '@/components/charts/GradeTrendChart';
import AbsenceTrendChart from '@/components/charts/AbsenceTrendChart';

export default function FamilyDashboard() {
  const { profile } = useAuth();

  const [selectedStudent, setSelectedStudent] = React.useState<{id: string, name: string} | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const { data: linkedStudents, isLoading, refetch } = useQuery({
    queryKey: ['family_dashboard_links', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.rpc('get_family_dashboard', {
        p_family_profile_id: profile.id
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  const activeLinks = linkedStudents?.filter((l: any) => l.status === 'active') || [];
  const pendingLinks = linkedStudents?.filter((l: any) => l.status === 'pending') || [];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6"> 
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 shadow-md border ring-2 ring-primary/5">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portal da Família</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {activeLinks.length > 0
                ? `Acompanhando o desenvolvimento de ${activeLinks.length === 1 ? '1 dependente' : `${activeLinks.length} dependentes`}.`
                : 'Solicite vínculos para acompanhar o desempenho acadêmico.'}
            </p>
          </div>
        </div>

        <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-lg hover:shadow-xl transition-all shadow-primary/20">
          <UserPlus className="w-4 h-4 mr-2" />
          Solicitar Novo Vínculo
        </Button>
      </div>

      <div className="space-y-12">
        {/* Seção de Pendências */}
        {pendingLinks.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                  Solicitações em Análise
                </h2>
                <div className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200/50">
                  {pendingLinks.length}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingLinks.map((link: any) => (
                  <Card key={link.link_id} className="bg-amber-50/30 dark:bg-amber-950/5 border-amber-200/50 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-amber-200/50">
                          <AvatarImage src={link.student?.avatar_url} />
                          <AvatarFallback className="bg-amber-100 text-amber-700">{link.student?.full_name?.substring(0, 2).toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{link.student?.full_name || 'Aluno em identificação'}</CardTitle>
                          <CardDescription className="text-[10px] truncate flex items-center gap-1 mt-0.5">
                            <School className="w-3 h-3" /> {link.institution?.name}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <p className="text-[10px] text-muted-foreground italic">
                         Aguardando validação da secretaria da instituição.
                       </p>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </section>
        )}

        {/* Seção Principal de Dependentes */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            Dependentes Ativos
          </h2>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeLinks.length === 0 ? (
            <Card className="border-dashed bg-muted/30 border-2">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <UserCircle className="w-12 h-12 mb-4 opacity-40" />
                <p className="font-semibold text-foreground">Nenhum vínculo ativo encontrado.</p>    
                <p className="text-xs mt-2 max-w-sm">
                  {pendingLinks.length > 0
                   ? 'Suas solicitações estão sendo analisadas pelas instituições.'
                   : 'Vincule-se a uma instituição para visualizar notas, frequências e relatórios acadêmicos.'}
                </p>
                {pendingLinks.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    Começar agora
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {activeLinks.map((link: any) => (
                <Card key={link.link_id} className="overflow-hidden border-primary/10 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="h-1.5 w-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.3)]" /> 
                  <CardHeader className="pb-6 border-b bg-white dark:bg-zinc-900">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-4">
                        <Avatar className="h-14 w-14 border shadow-sm ring-2 ring-violet-100 dark:ring-violet-900/20">
                          <AvatarImage src={link.student?.avatar_url} />
                          <AvatarFallback className="bg-violet-100 text-violet-700">{link.student?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{link.student?.full_name}</CardTitle>
                          <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-violet-600 dark:text-violet-400">
                            <School className="w-4 h-4" />
                            {link.institution?.name}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200/50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Vínculo Ativo
                        </span>
                        <Button
                           variant="outline"
                           size="sm"
                           className="h-8 gap-1.5 text-xs border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"
                           onClick={() => setSelectedStudent({ id: link.student?.id, name: link.student?.full_name })}
                        >
                          <FileText className="w-3.5 h-3.5" /> Detalhes do Perfil
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x border-b">
                      <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Média Geral (GPA)</p>
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{link.academic_summary?.gpa || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total de Faltas</p>
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{link.academic_summary?.total_absences || 0}</p>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saldo Pendente</p>
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(link.financial_summary?.pending_balance || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Tabs defaultValue="academic" className="w-full">
                      <div className="px-6 pt-6 flex justify-center">
                        <TabsList className="grid w-full max-w-md grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-1">
                          <TabsTrigger value="academic" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 transition-all">
                            Desempenho Acadêmico
                          </TabsTrigger>
                          <TabsTrigger value="financial" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 transition-all">
                            Situação Financeira
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="academic" className="p-6 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-violet-500" /> Evolução de Notas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <GradeTrendChart data={link.academic_summary?.history || []} />
                            </CardContent>
                          </Card>
                          <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500" /> Registro de Faltas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <AbsenceTrendChart data={link.academic_summary?.history || []} />
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="financial" className="p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-3xl mx-auto">
                          {link.financial_summary?.recent_payments?.length > 0 ? (
                            <div className="rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b">
                                  <tr>
                                    <th className="px-4 py-3 text-left">Descrição</th>
                                    <th className="px-4 py-3 text-center">Vencimento</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {link.financial_summary.recent_payments.map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                      <td className="px-4 py-4 font-medium">{payment.description}</td>
                                      <td className="px-4 py-4 text-center text-muted-foreground">
                                        {format(parseISO(payment.due_date), "dd/MM/yyyy")}
                                      </td>
                                      <td className="px-4 py-4 text-right font-bold">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                          payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                          payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                                          'bg-amber-100 text-amber-700'
                                        }`}>
                                          {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                              <p className="text-muted-foreground">Nenhum registro financeiro disponível.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddDependentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={refetch}
        familyProfileId={profile?.id || ''}
      />

      <ParentStudentViewModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.name || ''}
      />
    </div>
  );
}

