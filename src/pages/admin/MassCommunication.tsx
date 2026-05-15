import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, SelectGroup, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Mail, Send, Users, Info, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MassCommunication() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [targetRole, setTargetTab] = useState('all');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 1. Fetch recipient IDs based on target
  const fetchRecipients = async (role: string) => {
    let query = supabase.from('profiles').select('user_id');
    if (role !== 'all') {
      // In the new schema, profile_type is an array
      query = query.contains('profile_type', [role]);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(p => p.user_id);
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      const recipientIds = await fetchRecipients(targetRole);
      
      if (recipientIds.length === 0) {
        throw new Error('Nenhum usuário encontrado para este segmento.');
      }

      const { data, error } = await supabase.rpc('send_mass_notifications', {
        p_recipient_ids: recipientIds,
        p_message: message,
        p_link: link || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Notificações enviadas com sucesso!');
      setMessage('');
      setLink('');
      setIsSending(false);
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`);
      setIsSending(false);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Comunicação em Massa</h2>
        <p className="text-muted-foreground">Envie avisos e campanhas para usuários da plataforma.</p>
      </div>

      <Tabs defaultValue="notifications" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="notifications" className="flex gap-2">
            <Megaphone className="h-4 w-4" /> Avisos do Sistema
          </TabsTrigger>
          <TabsTrigger value="email" className="flex gap-2">
            <Mail className="h-4 w-4" /> Campanhas de E-mail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Notificação Interna</CardTitle>
              <CardDescription>Esta mensagem aparecerá no sino de notificações dos usuários selecionados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Segmento Alvo</label>
                  <Select value={targetRole} onValueChange={setTargetTab}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Usuários</SelectItem>
                      <SelectItem value="personal">Apenas Pais/Alunos</SelectItem>
                      <SelectItem value="professional">Apenas Professores</SelectItem>
                      <SelectItem value="institutional">Apenas Instituições</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link de Destino (Opcional)</label>
                  <Input 
                    placeholder="https://enlacados.com.br/portal/..." 
                    value={link} 
                    onChange={e => setLink(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea 
                  placeholder="Escreva aqui o comunicado importante..." 
                  className="min-h-[120px]"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Dica de Redação:</p>
                  <p>Mantenha a mensagem curta e direta. Use o link se precisar que o usuário realize uma ação específica.</p>
                </div>
              </div>

              <Button 
                className="w-full" 
                disabled={!message || isSending} 
                onClick={() => sendNotificationMutation.mutate()}
              >
                {isSending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Disparar Notificações</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas de Onboarding</CardTitle>
              <CardDescription>Dispare sequências de e-mail para instituições e novos usuários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">Recomendado</Badge>
                  </div>
                  <div>
                    <h4 className="font-bold">Boas-vindas (Institucional)</h4>
                    <p className="text-sm text-muted-foreground">E-mail para instituições recém-cadastradas que ainda não subiram o logo.</p>
                  </div>
                  <Button variant="secondary" className="w-full" size="sm" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                    Configurar e Enviar
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600 w-fit">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">Upgrade de Plano</h4>
                    <p className="text-sm text-muted-foreground">Campanha para converter usuários Free em assinantes Pro.</p>
                  </div>
                  <Button variant="secondary" className="w-full" size="sm" disabled>
                    Indisponível (Sprint 6)
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-dashed rounded-lg text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">A integração total com o Resend para campanhas personalizadas está agendada para a próxima Sprint.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode, variant?: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
      {children}
    </span>
  );
}
