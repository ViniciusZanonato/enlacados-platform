import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '/logo.png'; // Import the logo
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client'; // Primary user's client
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileToLink {
  profile_id: string;
  full_name: string;
  avatar_url: string;
  type: string;
}

const LinkAccountPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: primaryUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [linkingCode, setLinkingCode] = useState('');
  const [profileToLink, setProfileToLink] = useState<ProfileToLink | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [createAccountData, setCreateAccountData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const getTempSupabaseClient = () => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    // persistSession: false prevents this temporary client from overwriting the main user's session in localStorage
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  };

  const handleVerifyCode = async () => {
    if (!linkingCode) {
      toast.error('Por favor, insira um código de vinculação.');
      return;
    }
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.rpc('get_profile_by_linking_code', { p_linking_code: linkingCode });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Código de vinculação inválido ou não encontrado.');
        setProfileToLink(null);
      } else {
        setProfileToLink(data[0]);
      }
    } catch (error: Error) {
      toast.error(error.message || 'Erro ao verificar o código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLinkExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryUser) {
      toast.error('Você precisa estar logado para vincular uma conta.');
      return;
    }
    if (!profileToLink) {
      toast.error('Verifique o código de vinculação antes de continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: rpcError } = await supabase.rpc('link_account', {
        linked_user_id_to_add: profileToLink.profile_id,
      });

      if (rpcError) {
        throw rpcError;
      }

      toast.success('Solicitação de vinculação enviada com sucesso!');
      await queryClient.invalidateQueries({ queryKey: ['linkedAccounts', primaryUser.id] });
      navigate('/');

    } catch (error: Error) {
      toast.error(error.message || 'Ocorreu um erro ao vincular a conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Logic for Creating and Linking New Account ---
  const handleCreateAndLinkNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryUser) {
      toast.error('Você precisa estar logado para criar e vincular uma conta.');
      return;
    }

    if (createAccountData.password !== createAccountData.confirmPassword) {
      toast.error('As senhas não coincidem!');
      return;
    }

    if (createAccountData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres!');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: emailExists, error: checkError } = await supabase.rpc('check_if_email_exists', {
        email_to_check: createAccountData.email,
      });

      if (checkError) {
        throw new Error("Erro ao verificar e-mail. Tente novamente.");
      }

      if (emailExists) {
        toast.error("Este e-mail já está cadastrado em outra conta.");
        setIsSubmitting(false);
        return;
      }

      const tempSupabase = getTempSupabaseClient();

      const { data: newAuthData, error: signUpError } = await tempSupabase.auth.signUp({
        email: createAccountData.email,
        password: createAccountData.password,
        options: {
          data: { full_name: createAccountData.fullName },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message || 'Erro ao criar nova conta.');
      }

      const newUserId = newAuthData?.user?.id;
      if (!newUserId) {
        throw new Error('Não foi possível obter o ID da nova conta. Verifique o e-mail para confirmação.');
      }

      // Link the account in the database
      const { error: rpcError } = await supabase.rpc('link_account', {
        linked_user_id_to_add: newUserId,
      });

      if (rpcError) {
        throw rpcError;
      }

      toast.success('Nova conta criada e vinculada com sucesso! Verifique o e-mail da nova conta para confirmar.');
      await queryClient.invalidateQueries({ queryKey: ['linkedAccounts', primaryUser.id] });
      navigate('/');

    } catch (error: Error) {
      toast.error(error.message || 'Ocorreu um erro ao criar e vincular a conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoSrc} alt="Enlaçados Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text">Gerenciar Vínculos de Conta</h1>
          <p className="text-muted-foreground mt-2">
            Adicione contas existentes ou crie novas para alternar facilmente entre elas.
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-elegant border border-border">
          <Tabs defaultValue="linkExisting" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="linkExisting">Vincular Existente</TabsTrigger>
              <TabsTrigger value="createNew">Criar Nova</TabsTrigger>
            </TabsList>

            <TabsContent value="linkExisting">
              <form onSubmit={handleLinkExistingAccount} className="space-y-6">
                <div>
                  <Label htmlFor="linking-code">Código de Vinculação</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="linking-code"
                      value={linkingCode}
                      onChange={(e) => setLinkingCode(e.target.value)}
                      placeholder="Cole o código de vinculação aqui"
                      required
                    />
                    <Button type="button" onClick={handleVerifyCode} disabled={isVerifying}>
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                    </Button>
                  </div>
                </div>

                {profileToLink && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="font-semibold">Você está prestes a se vincular a:</p>
                    <div className="flex items-center mt-2">
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage src={profileToLink.avatar_url} />
                        <AvatarFallback>{profileToLink.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{profileToLink.full_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{profileToLink.type}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isSubmitting || !profileToLink}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    'Vincular Conta'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="createNew">
              <form onSubmit={handleCreateAndLinkNewAccount} className="space-y-6">
                <div>
                  <Label htmlFor="create-name">Nome Completo</Label>
                  <Input
                    id="create-name"
                    value={createAccountData.fullName}
                    onChange={(e) =>
                      setCreateAccountData({ ...createAccountData, fullName: e.target.value })
                    }
                    placeholder="Nome completo da nova conta"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="create-email">Email da Nova Conta</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createAccountData.email}
                    onChange={(e) =>
                      setCreateAccountData({ ...createAccountData, email: e.target.value })
                    }
                    placeholder="novo.email@exemplo.com"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="create-password">Senha</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createAccountData.password}
                    onChange={(e) =>
                      setCreateAccountData({ ...createAccountData, password: e.target.value })
                    }
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="create-confirm-password">Confirmar Senha</Label>
                  <Input
                    id="create-confirm-password"
                    type="password"
                    value={createAccountData.confirmPassword}
                    onChange={(e) =>
                      setCreateAccountData({
                        ...createAccountData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Digite a senha novamente"
                    required
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando e Vinculando...
                    </>
                  ) : (
                    'Criar e Vincular Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LinkAccountPage;