import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/api/supabase/client";
import { validatePassword } from "@/lib/validators";
import { handleSupabaseError } from "@/lib/supabase-error-handler";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Effect to pre-fill email from navigation state (for account switching)
  useEffect(() => {
    if (location.state?.email) {
      setLoginData(prev => ({ ...prev, email: location.state.email }));
      // Clear state after using it to prevent re-filling on navigation
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  // Effect to handle URL fragments (e.g., from email confirmation redirects)
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Session found, navigate to portal and clear URL fragment
        navigate("/", { replace: true });
        // Clear the URL fragment to hide tokens
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (window.location.hash) {
        // If there's a hash but no session, it might be an error or an incomplete redirect
        // Clear the hash anyway to prevent tokens from lingering
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Erro ao conectar com Google");
      console.error(error);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(loginData.email, loginData.password);
      toast.success("Login realizado com sucesso!");

      const redirectTo = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      // Only allow internal paths (must start with / and not contain //) to prevent open redirect
      const isSafePath = redirectTo && /^\/(?!\/)/.test(redirectTo);
      navigate(isSafePath ? redirectTo : '/', { replace: true });
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        toast.error('E-mail ou senha inválidos. Por favor, tente novamente.');
      } else if (error.message === 'Email not confirmed') {
        toast.error('Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.');
      } else {
        handleSupabaseError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    const { isValid, message } = validatePassword(signupData.password);
    if (!isValid) {
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Proceed directly with sign up to avoid account enumeration
      const { error: signUpError } = await signUp(
        signupData.email,
        signupData.password,
        signupData.fullName
      );

      if (signUpError) {
        // Handle common errors generically to avoid enumeration leaks
        if (signUpError.message.includes('already registered')) {
          toast.success("Se o e-mail for válido, você receberá um link de confirmação.");
          navigate("/");
          return;
        }
        handleSupabaseError(signUpError);
        return;
      }

      toast.success("Processando... Por favor, verifique seu e-mail para os próximos passos.");
      navigate("/");

    } catch (error: any) {
      handleSupabaseError(error);
    } finally {
      setIsSubmitting(false);
    }

  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 20%, hsl(270 80% 55% / 0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(280 70% 45% / 0.12) 0%, transparent 55%)' }} />

      <div className="w-full max-w-md relative">
        {/* Brand header */}
        <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <img src="/logo.png" alt="Enlaçados Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-sm" />
          <h1 className="text-5xl font-black leading-none gradient-text mb-2">Enlaçados</h1>
          <p className="text-muted-foreground font-thin tracking-wide">
            Onde cada conexão faz a educação acontecer
          </p>
        </div>

        <div className="relative bg-card rounded-2xl p-8 border border-border/50 overflow-hidden" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.08s both' }}>
          {/* Subtle top accent */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="mb-6 space-y-4">
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-thin tracking-wide relative hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 border-border/60"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 absolute left-4" aria-hidden="true" display="block" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
              Entrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 label-pill text-muted-foreground/60">
                  ou continue com email
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/40 border border-border/40 p-1">
              <TabsTrigger value="login" className="text-xs font-thin tracking-widest uppercase data-[state=active]:font-black data-[state=active]:text-primary data-[state=active]:tracking-tight">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs font-thin tracking-widest uppercase data-[state=active]:font-black data-[state=active]:text-primary data-[state=active]:tracking-tight">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Sua senha"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs font-thin tracking-wide text-muted-foreground hover:text-primary"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Esqueceu sua senha?
                  </Button>
                </div>

                <Button type="submit" variant="hero" className="w-full font-black" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    placeholder="Seu nome"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="signup-confirm" className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="Digite a senha novamente"
                    required
                    className="mt-1.5 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(v) => setAcceptedTerms(!!v)}
                  />
                  <label htmlFor="accept-terms" className="text-xs font-thin leading-snug text-muted-foreground">
                    Li e aceito os{' '}
                    <Link to="/termos" className="text-primary hover:text-primary/80 underline underline-offset-2">Termos de Uso</Link>
                    {' '}e a{' '}
                    <Link to="/privacidade" className="text-primary hover:text-primary/80 underline underline-offset-2">Política de Privacidade</Link>
                  </label>
                </div>

                <Button type="submit" variant="hero" className="w-full font-black" disabled={isSubmitting || !acceptedTerms}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
