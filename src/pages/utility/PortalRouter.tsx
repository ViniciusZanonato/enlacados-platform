import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, GraduationCap, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';

// Máximo de tentativas de polling aguardando confirmação do webhook
const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2500;

const PortalRouter = () => {
  const { profile, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // Valida que o session_id tem o formato real do Stripe (cs_live_ ou cs_test_)
  // evitando polling desnecessário por query params arbitrários
  const rawSessionId = searchParams.get('session_id');
  const sessionId = rawSessionId?.startsWith('cs_') ? rawSessionId : null;

  // Estado de polling para retorno do checkout
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(!!sessionId);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Plano capturado no momento do retorno do Stripe (antes do webhook atualizar)
  // Guardado em state para que o efeito de polling reaja corretamente
  const [initialPlan, setInitialPlan] = useState<string | undefined>(undefined);
  const [planCaptured, setPlanCaptured] = useState(false);

  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Captura o plano atual uma única vez, quando o perfil carrega
  useEffect(() => {
    if (!loading && profile && !planCaptured) {
      setInitialPlan((profile as any).plan ?? undefined);
      setPlanCaptured(true);
    }
  }, [loading, profile, planCaptured]);

  // Polling: re-busca o perfil até o plano mudar (webhook processado) ou timeout.
  // Só inicia após o plano inicial ter sido capturado (planCaptured === true).
  useEffect(() => {
    if (!sessionId || !planCaptured) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      pollAttemptsRef.current += 1;

      // Re-fetch direto do Supabase para não depender do cache do React Query
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || cancelled) return;

      const { data: freshProfile } = await (supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', authUser.id)
        .single() as any);

      const updatedPlan: string | undefined = freshProfile?.plan ?? undefined;
      const planChanged = updatedPlan !== undefined && updatedPlan !== initialPlan;

      if (planChanged) {
        if (cancelled) return;
        setPaymentConfirmed(true);
        setIsConfirmingPayment(false);
        toast.success('Pagamento confirmado! Seu plano foi atualizado.');
        // Invalida o cache do perfil para que useAuth re-busque com o plano novo
        await queryClient.invalidateQueries({ queryKey: ['profile', authUser.id] });
        // Pequena pausa para o usuário ver a tela de confirmação antes de navegar
        setTimeout(() => redirectToPortal(profile), 1200);
        return;
      }

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        // Timeout: webhook pode ainda estar a caminho — redireciona com aviso
        if (cancelled) return;
        setIsConfirmingPayment(false);
        toast.info(
          'Pagamento recebido! A confirmação pode levar alguns instantes. ' +
          'Atualize a página em breve se seu plano ainda não aparecer atualizado.',
          { duration: 8000 }
        );
        redirectToPortal(profile);
        return;
      }

      if (!cancelled) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    // Inicia polling com pequeno delay inicial para dar tempo ao webhook
    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  // redirectToPortal é estável pois depende só de navigate (ref estável do router)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, planCaptured, initialPlan]);

  // Navegação normal (sem session_id ou quando polling termina)
  useEffect(() => {
    if (isConfirmingPayment || loading) return; 

    if (user && !profile) {
      // Usuário autenticado mas sem registro de perfil -> Força Setup
      navigate('/portal/setup');
      return;
    }

    if (profile) {
      redirectToPortal(profile);
    }
  }, [profile, loading, user, isConfirmingPayment]);

  const [forceRole, setForceRole] = useState<string | null>(null);

  function getActiveRoles(p: any): string[] {
    if (!p) return [];
    if (Array.isArray(p.profile_type)) return p.profile_type;
    return [p.profile_type].filter(Boolean);
  }

  function redirectToPortal(prof: any, roleOverride?: string) {
    if (!prof) return;
    const roles = getActiveRoles(prof);
    const activeRole = roleOverride || (roles.length === 1 ? roles[0] : null);

    if (!activeRole && roles.length > 1) {
      // Stay on selection screen
      return;
    }

    // Admins vão direto para o painel administrativo
    if (activeRole === 'admin') {
      navigate('/admin');
      return;
    }

    // null ou false = onboarding não concluído; só pula se === true
    if (!prof.onboarding_completed) {
      navigate('/portal/setup');
      return;
    }

    switch (activeRole) {
      case 'professional': navigate('/portal/professional'); break;
      case 'institutional': navigate('/portal/institutional'); break;
      case 'personal': navigate('/portal/student'); break;
      case 'family': navigate('/portal/family'); break;
      default: navigate('/'); break;
    }
  }

  const roles = getActiveRoles(profile);

  // Se o usuário tem múltiplos papéis e ainda não escolheu um nesta sessão do router
  if (!loading && profile && roles.length > 1 && !forceRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo de volta!</h2>
            <p className="mt-2 text-muted-foreground">Selecione qual portal você deseja acessar hoje.</p>
          </div>

          <div className="grid gap-4 mt-8">
            {roles.map((role) => {
              const config = {
                personal: { label: 'Portal do Aluno', icon: '👨‍🎓' },
                professional: { label: 'Portal do Profissional', icon: '💼' },
                institutional: { label: 'Portal da Instituição', icon: '🏫' },
                family: { label: 'Portal da Família', icon: '🏠' },
                admin: { label: 'Painel Administrativo', icon: '🛡️' },
              }[role as keyof typeof config] || { label: role, icon: '👤' };

              return (
                <button
                  key={role}
                  onClick={() => {
                    setForceRole(role);
                    redirectToPortal(profile, role);
                  }}
                  className="flex items-center p-4 bg-card hover:bg-accent border rounded-xl transition-all duration-200 group text-left shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl mr-4">{config.icon}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {config.label}
                    </span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <p className="text-lg font-semibold text-foreground">Pagamento confirmado!</p>
        <p className="text-sm text-muted-foreground">Redirecionando para seu portal...</p>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (isConfirmingPayment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <p className="text-base font-medium text-foreground">Confirmando pagamento...</p>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Isso pode levar alguns instantes. Não feche esta página.
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 bg-background">
      <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
        <GraduationCap className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm text-muted-foreground">Carregando seu portal...</p>
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
    </div>
  );
};

export default PortalRouter;
