import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function MentoringDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed'>('confirmed');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['professional_appointments', profile?.id, filter],
    queryFn: async () => {
      if (!profile?.id) return [];

      let query = supabase
        .from('appointments')
        .select(`
          *,
          student:profiles!student_id(id, full_name, avatar_url, phone_masked)
        `)
        .eq('mentor_id', profile.id)
        .order('start_time', { ascending: true });

      if (filter !== 'all') {
         query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status da consulta atualizado.');
      queryClient.invalidateQueries({ queryKey: ['professional_appointments'] });
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Agenda e Mentorias</h2>
          <p className="text-muted-foreground text-sm font-light">Gerencie suas sessões de consultoria, testes vocacionais e reuniões.</p>
        </div>
        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
          <Button variant={filter === 'confirmed' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('confirmed')}>
            Agendadas
          </Button>
          <Button variant={filter === 'completed' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('completed')}>
             Concluídas
          </Button>
          <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>
             Todas
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !appointments || appointments.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
            <Calendar className="w-12 h-12 mb-4 opacity-40 shrink-0" />
            <p className="font-medium">Nenhuma consulta encontrada.</p>
            <p className="text-sm mt-1">Sua agenda está livre neste recorte.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt: any) => (
            <Card key={appt.id} className="group hover:shadow-md transition-all">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={appt.student?.avatar_url} />
                      <AvatarFallback>{appt.student?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{appt.student?.full_name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-[10px] font-mono tracking-wider">
                         {appt.student?.phone_masked || 'Sem Contato'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">{format(parseISO(appt.start_time), "EEEE, dd 'de' MMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  {format(parseISO(appt.start_time), "HH:mm")} - {format(parseISO(appt.end_time), "HH:mm")}
                </div>

                {appt.notes && (
                  <div className="bg-muted p-2 rounded text-xs text-muted-foreground italic border-l-2 border-primary">
                    "{appt.notes}"
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2 border-t border-dashed">
                  {appt.status === 'confirmed' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="text-red-500 hover:text-red-600 hover:bg-red-50"
                         onClick={() => updateStatusMutation.mutate({ id: appt.id, newStatus: 'cancelled_by_mentor' })}
                         disabled={updateStatusMutation.isPending}
                       >
                         <XCircle className="w-4 h-4 mr-1.5" /> Cancelar
                       </Button>
                       <Button 
                         size="sm"
                         className="bg-green-600 hover:bg-green-700 text-white"
                         onClick={() => updateStatusMutation.mutate({ id: appt.id, newStatus: 'completed' })}
                         disabled={updateStatusMutation.isPending}
                       >
                         <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir
                       </Button>
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-center">
                       {appt.status === 'completed' ? (
                         <span className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-xs">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Sessão Concluída
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full text-xs">
                           <XCircle className="w-3.5 h-3.5" /> Cancelada
                         </span>
                       )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
