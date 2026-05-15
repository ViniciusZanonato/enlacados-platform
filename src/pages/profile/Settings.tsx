import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/validators';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { Loader2, CreditCard, Briefcase, Building2, User, PlusCircle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const UpdatePasswordSection = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    const { isValid, message } = validatePassword(password);
    if (!isValid) {
      toast.error(message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      handleSupabaseError(error);
    } else {
      toast.success('Senha atualizada com sucesso!');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl">
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>Escolha uma nova senha para acessar sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2"
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Senha'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const ChangeEmailSection = () => {
    const { user: authUser } = useAuth();
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      if (!authUser?.email) {
        toast.error("E-mail não encontrado.");
        setLoading(false);
        return;
      }

      // First, verify the user's password
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password,
      });
  
      if (passwordError) {
        toast.error("Senha incorreta. Por favor, tente novamente.");
        setLoading(false);
        return;
      }
  
      // If password is correct, update the email
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
  
      setLoading(false);
  
      if (emailError) {
        handleSupabaseError(emailError);
      } else {
        toast.success("E-mail de confirmação enviado! Por favor, verifique sua nova caixa de entrada para confirmar a alteração.");
        setNewEmail('');
        setPassword('');
      }
    };
  
    return (
      <Card className="shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle>Alterar E-mail</CardTitle>
          <CardDescription>Para alterar seu e-mail, por favor, confirme sua senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-email">Novo E-mail</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo.email@exemplo.com"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="current-password-for-email">Senha Atual</Label>
              <Input
                id="current-password-for-email"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-2"
              />
            </div>
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Alterar E-mail'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

const CancelSubscriptionSection = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const plan = (profile as any)?.plan;
  const status = (profile as any)?.subscription_status;
  const isPaid = plan && plan !== 'free';
  const isCancelling = status === 'cancelling';

  if (!isPaid) return null;

  const handleCancel = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar assinatura');

      toast.success(data.message ?? 'Cancelamento agendado.');
    } catch (err: any) {
      handleSupabaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Assinatura
        </CardTitle>
        <CardDescription>
          Plano atual: <strong className="text-foreground capitalize">{plan}</strong>
          {isCancelling && (
            <span className="ml-2 text-orange-600 font-medium">— cancelamento agendado</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCancelling ? (
          <p className="text-sm text-muted-foreground">
            Sua assinatura será encerrada ao fim do período atual. Você mantém acesso até lá.
          </p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                Cancelar assinatura
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você manterá acesso até o fim do período já pago. Após isso, seu plano voltará
                  para o gratuito automaticamente. Esta ação pode ser revertida
                  reativando a assinatura em Planos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar cancelamento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
};

const DeleteAccountSection = () => {
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmationText !== 'EXCLUIR') {
      toast.error('Para confirmar a exclusão, digite "EXCLUIR" no campo de texto.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc('delete_user_account');

    setLoading(false);

    if (error) {
      handleSupabaseError(error);
    } else {
      toast.success("Conta excluída com sucesso. Você será desconectado.");
      await supabase.auth.signOut();
      window.location.href = '/'; // Redirect to home
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        <CardDescription>A exclusão da sua conta é uma ação irreversível.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">Excluir Minha Conta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
                Para confirmar, digite <strong>EXCLUIR</strong> abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder='EXCLUIR'
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmationText('')}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={loading || confirmationText !== 'EXCLUIR'}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};


import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AccessibilitySection = () => {
  const [highContrast, setHighContrast] = useState(false);

  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    // Logic to apply/remove high contrast theme
    if (checked) {
      document.documentElement.classList.add('dark'); // Or a specific high-contrast theme
      toast.info("Modo de alto contraste ativado.");
    } else {
      document.documentElement.classList.remove('dark');
      toast.info("Modo de alto contraste desativado.");
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl">
      <CardHeader>
        <CardTitle>Acessibilidade</CardTitle>
        <CardDescription>Personalize a aparência para melhor atender às suas necessidades.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast-mode">Modo de Alto Contraste</Label>
          <Switch
            id="high-contrast-mode"
            checked={highContrast}
            onCheckedChange={handleHighContrastChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const PrivacySection = () => {
  const { user } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);

  const handlePrivacyChange = async (checked: boolean) => {
    setIsPrivate(checked);
    if (!user) return;
    // Logic to update profile privacy in the database
    const { error } = await supabase.from('profiles').update({ is_private: checked }).eq('user_id', user.id);
    if (error) {
      toast.error("Erro ao atualizar a privacidade do perfil.");
    } else {
      toast.success(checked ? "Seu perfil agora é privado." : "Seu perfil agora é público.");
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl">
      <CardHeader>
        <CardTitle>Privacidade</CardTitle>
        <CardDescription>Controle quem pode ver seu perfil e suas informações.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="private-profile">Tornar Perfil Privado</Label>
          <Switch
            id="private-profile"
            checked={isPrivate}
            onCheckedChange={handlePrivacyChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationsSection = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
  
    const handleEmailNotificationsChange = (checked: boolean) => {
      setEmailNotifications(checked);
      // Here you would typically call an API to update the user's notification preferences
      toast.info(`Notificações por e-mail ${checked ? 'ativadas' : 'desativadas'}.`);
    };
  
    return (
      <Card className="shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Gerencie como você recebe atualizações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Receber notificações por e-mail</Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={handleEmailNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const LanguageRegionSection = () => {
    const [language, setLanguage] = useState('pt-br');
  
    const handleLanguageChange = (value: string) => {
      setLanguage(value);
      // Here you would typically use a library like i18next to change the language
      toast.info(`Idioma alterado para ${value}.`);
    };
  
    return (
      <Card className="shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle>Idioma e Região</CardTitle>
          <CardDescription>Escolha o idioma de exibição da plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
            <Label htmlFor="language-select">Idioma</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-full mt-2">
                    <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                    <SelectItem value="en-us">English (United States)</SelectItem>
                    <SelectItem value="es-es">Español (España)</SelectItem>
                </SelectContent>
            </Select>
        </CardContent>
      </Card>
    );
  };

const ProfileManagementSection = () => {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleRemoveRole = async (roleToRemove: string) => {
    if (!profile || !user) return;
    
    if (profile.profile_type.length <= 1) {
      toast.error("Você deve ter pelo menos um papel ativo na conta.");
      return;
    }

    setLoading(roleToRemove);
    try {
      const newRoles = profile.profile_type.filter(r => r !== roleToRemove);
      
      const { error } = await supabase
        .from('profiles')
        .update({ profile_type: newRoles })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Papel ${roleToRemove} removido com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (err: any) {
      toast.error("Erro ao remover papel: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="shadow-lg rounded-3xl border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Gerenciar Contas & Perfis
        </CardTitle>
        <CardDescription>
          Você pode ter múltiplos papéis na mesma conta. Ative novos ou remova os que não usa mais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {profile?.profile_type?.map((role) => (
            <div key={role} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                   {role === 'institutional' ? <Building2 className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="font-bold text-sm uppercase tracking-tight">{role}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Perfil Ativo</p>
                </div>
              </div>
              {role !== 'personal' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Desvincular
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá seu acesso como {role}. Seus dados desse perfil continuarão no banco, mas você não poderá mais acessá-lo sem reativar no Onboarding.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemoveRole(role)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                         {loading === role ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, Desvincular"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>

        <Button asChild variant="outline" className="w-full h-12 rounded-2xl border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 font-bold">
           <Link to="/portal/setup">
             <PlusCircle className="mr-2 h-4 w-4" />
             Adicionar Novo Perfil
           </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const LinkingCodeSection = () => {
  const { user } = useAuth();
  const { profile, institutionalProfile, professionalProfile } = useProfile(user?.id);
  const code = profile?.profile_type?.includes('institutional') ? institutionalProfile?.linking_code : professionalProfile?.linking_code;

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Código de vinculação copiado!");
  };

  return (
    <Card className="shadow-2xl rounded-3xl bg-[#1A1A1E] border-[#2A2A2E] text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-black">Código de Vinculação</CardTitle>
        <CardDescription className="text-gray-400">
          Use este código para permitir que outras pessoas se vinculem ao seu perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 bg-[#0F0F12] border border-[#2A2A2E] rounded-2xl px-4 py-3 font-mono text-lg tracking-wider text-gray-200">
            {code}
          </div>
          <Button onClick={handleCopy} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-2xl px-8">
            Copiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="text-4xl font-bold text-center mb-12">Configurações da Conta</h1>
      <div className="space-y-8">
        <ProfileManagementSection />
        <LinkingCodeSection />
        <UpdatePasswordSection />
        <ChangeEmailSection />
        <CancelSubscriptionSection />
        <PrivacySection />
        <NotificationsSection />
        <AccessibilitySection />
        <LanguageRegionSection />
        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default Settings;