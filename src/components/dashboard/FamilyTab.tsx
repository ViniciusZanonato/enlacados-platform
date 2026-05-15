import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ShieldAlert, CheckCircle2, XCircle, Clock, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FamilyTab({ studentId, institutionalProfileId }: { studentId: string, institutionalProfileId: string }) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDecryptingPhone, setIsDecryptingPhone] = useState<string | null>(null);

  const { data: familyLinks, isLoading, error: fetchError } = useQuery({
    queryKey: ['family_links', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_family_links_for_student', {
         p_student_id: studentId,
         p_institution_id: institutionalProfileId
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!studentId && !!institutionalProfileId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'rejected' }) => {
      setProcessingId(id);
      const { data: userRaw } = await supabase.auth.getUser();
      
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userRaw.user?.id)
        .single();

      const { error } = await supabase
        .from('family_links')
        .update({ 
          status, 
          approved_by: adminProfile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'active' ? 'Vínculo Aprovado!' : 'Vínculo Rejeitado!');
      queryClient.invalidateQueries({ queryKey: ['family_links', studentId] });
      setProcessingId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar vínculo: ${error.message}`);
      setProcessingId(null);
    }
  });

  if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    const maskCpf = (cpf: string) => {
    // Como a nova engine do Postgres agora substitui a string bruta pela máscara permanentemente
    // não precisamos mascarar o que já está na máscara, mas deixamos aqui como fallback passivo.
    if (!cpf || cpf.includes('*')) return cpf;
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
  };

  const handleWhatsApp = async (profileId: string, parentName: string) => {
    try {
      setIsDecryptingPhone(profileId);
      // O banco de dados agora encriptou as strings, ativamos a chave mestra e checamos LGPD:
      const { data, error } = await supabase.rpc('get_decrypted_profile', { target_user_profile_id: profileId });
      
      if (error) throw error;
      if (!data || !data.phone) throw new Error('Telefone não encontrado no cofre.');

      const cleanPhone = data.phone.replace(/\D/g, '');
      const msg = encodeURIComponent(`Olá ${parentName.split(' ')[0]}, aqui é do setor administrativo. Estamos analisando sua solicitação de vínculo no portal Enlaçados.`);
      
      // Abre o popup passando pelo bypass da restrição de janela pós-await usando um window object invisivel atrelado
      const newWindow = window.open('about:blank', '_blank');
      if (newWindow) {
         newWindow.location.href = `https://wa.me/55${cleanPhone}?text=${msg}`;
      }
    } catch (err: any) {
      toast.error(`Falha Extrema LGPD: ${err.message}`);
    } finally {
      setIsDecryptingPhone(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">Vínculos Familiares</h3>
      </div>

      {!familyLinks || familyLinks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium">Nenhum Pedido Familiar</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Não existem familiares ou responsáveis aguardando aprovação para este aluno nesta instituição.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {familyLinks.map((link) => {
            const isPending = link.status === 'pending';
            const isActive = link.status === 'active';
            const isRejected = link.status === 'rejected';

            return (
              <Card key={link.id} className={`overflow-hidden transition-all duration-200 ${isPending ? 'border-yellow-500/50 shadow-sm shadow-yellow-500/10' : isActive ? 'border-green-500/50' : 'opacity-75'}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    
                    {/* Ficha do Parente (Hover/Mini-Profile Concept Embedded) */}
                    <div className="flex-1 p-5 flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={link.parentProfile?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {link.parentProfile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg truncate">
                            {link.parentProfile?.full_name || 'Usuário Desconhecido'}
                          </h4>
                          <Badge variant={isPending ? 'outline' : isActive ? 'default' : 'secondary'} 
                                 className={isPending ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {isPending ? 'Pendente' : isActive ? 'Ativo' : 'Rejeitado'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5" title="Dados protegidos por LGPD Princípio do Mínimo Privilégio">
                            <ShieldAlert className="h-3.5 w-3.5" /> 
                            <span>CPF: <strong>{maskCpf(link.parentProfile?.cpf)}</strong></span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Solicitado em: {new Date(link.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Área de Ações */}
                    <div className="bg-muted/30 p-5 border-t sm:border-t-0 sm:border-l border-border flex flex-col justify-center gap-2 min-w-[200px]">
                      {isPending ? (
                        <>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white" 
                            size="sm"
                            disabled={processingId === link.id}
                            onClick={() => updateStatusMutation.mutate({ id: link.id, status: 'active' })}
                          >
                            {processingId === link.id ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <CheckCircle2 className="h-4 w-4 mr-1"/>}
                            Aprovar Acesso
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                            size="sm"
                            disabled={processingId === link.id}
                            onClick={() => updateStatusMutation.mutate({ id: link.id, status: 'rejected' })}
                          >
                            {processingId === link.id ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <XCircle className="h-4 w-4 mr-1"/>}
                            Rejeitar Pedido
                          </Button>
                        </>
                      ) : (
                        isActive && (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: link.id, status: 'rejected' })}
                            disabled={processingId === link.id}
                          >
                            <LinkIcon className="h-4 w-4 mr-1"/> Revogar Vínculo
                          </Button>
                        )
                      )}
                      
                      {/* Zap Action (Always visible except if no phone) */}
                      {link.parentProfile?.phone && (
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           className="w-full text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                           disabled={isDecryptingPhone === link.parentProfile.id}
                           onClick={() => handleWhatsApp(link.parentProfile!.id, link.parentProfile!.full_name || 'Familiar')}
                        >
                          {isDecryptingPhone === link.parentProfile.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1" />}
                          Contatar no WhatsApp
                        </Button>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
