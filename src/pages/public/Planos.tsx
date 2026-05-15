import { Check, Users, Building2, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/api/supabase/client";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/supabase-error-handler";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

//==========================
// Título : Página Planos — API pública + fallback estático
//==========================

type ApiPlan = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  price_brl: number | null;
  period: string | null;
  features: string[] | null;
  is_active: boolean;
};

// --- fallback se /api/plans falhar ---

const FALLBACK_INSTITUTIONS = [
  { name: "Básico", slug: "pro", price: "R$ 299", period: "/mês", description: "Ideal para instituições iniciantes na plataforma", highlighted: false, features: ["Perfil institucional completo", "Até 100 alunos cadastrados", "Gestão de comunicações", "Relatórios básicos", "Suporte prioritário", "Onboarding incluído"] },
  { name: "Profissional", slug: "enterprise", price: "R$ 550", period: "/mês", description: "Para instituições que buscam crescimento e análises avançadas", highlighted: true, features: ["Tudo do plano Básico", "Alunos ilimitados", "Business Intelligence completo", "Relatórios avançados e personalizados", "Integração com sistemas próprios", "Gestor de conta dedicado", "Treinamento da equipe"] },
];

const FALLBACK_PROFESSIONALS = [
  { name: "Essencial", slug: "essencial", price: "R$ 39,90", period: "/mês", description: "Perfeito para profissionais começando na plataforma", highlighted: false, features: ["Perfil profissional verificado", "Agenda integrada", "Até 20 atendimentos/mês", "Sistema de pagamentos", "Avaliações de clientes", "Suporte por chat"] },
  { name: "Especialista", slug: "especialista", price: "R$ 99", period: "/mês", description: "Para profissionais estabelecidos buscando crescimento", highlighted: true, features: ["Tudo do plano Essencial", "Atendimentos ilimitados", "Destaque nos resultados de busca", "Relatórios de desempenho", "Marketing e divulgação", "Integração com calendário externo", "Suporte prioritário 24/7"] },
];

// --- slugs → grupo (instituição ou profissional) ---
const SLUG_GROUP: Record<string, 'institutions' | 'professionals'> = {
  pro: 'institutions', enterprise: 'institutions',
  essencial: 'professionals', especialista: 'professionals',
};

function formatPrice(plan: ApiPlan): string {
  if (plan.price_brl == null || plan.price_brl === 0) return 'Gratuito';
  const n = plan.price_brl;
  return `R$ ${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')}`;
}

function mergePlan(
  fallback: typeof FALLBACK_INSTITUTIONS[0],
  apiPlans: ApiPlan[],
): typeof FALLBACK_INSTITUTIONS[0] {
  const api = apiPlans.find(p => p.slug === fallback.slug);
  if (!api) return fallback;
  return {
    ...fallback,
    name: api.display_name ?? fallback.name,
    price: formatPrice(api),
    period: api.period ?? fallback.period,
    description: api.description ?? fallback.description,
    features: api.features?.length ? api.features : fallback.features,
  };
}

const Planos = () => {
  const { user, profile, session: authSession, loading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [updatingProfileType, setUpdatingProfileType] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: apiPlans = [] } = useQuery<ApiPlan[]>({
    queryKey: ['plans-public'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) return [];
      const json = await res.json();
      return json.plans ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });



  const handlePlanSelection = async (planName: string, price: string, planSlug?: string) => {
    if (!user) {
      toast.info("Você precisa estar logado para selecionar um plano.");
      return;
    }

    // --- plano gratuito (RPC update_user_plan) ---
    if (price === "Gratuito") {
      setLoadingPlan(planName);
      try {
        const slugToUse = planSlug || 'free';
        const { error } = await (supabase.rpc as any)('update_user_plan', { target_slug: slugToUse });
        if (error) throw error;
        toast.success(`Plano ${planName} selecionado com sucesso!`);
      } catch (error: any) {
        handleSupabaseError(error, "Erro ao selecionar o plano.");
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    if (!planSlug) {
      toast.error("Configuração de plano inválida.");
      return;
    }

    setLoadingPlan(planName);
    try {
      const token = authSession?.access_token;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan_slug: planSlug }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao criar sessão de checkout');

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // merge fallback + resposta de /api/plans
  const freeApi = apiPlans.find(p => p.price_brl === 0 || p.price_brl == null && p.slug === 'free');
  const plans = {
    families: {
      icon: Users,
      title: "Famílias",
      price: freeApi ? formatPrice(freeApi) : "Gratuito",
      description: freeApi?.description ?? "Tudo que você precisa para acompanhar a jornada educacional",
      features: freeApi?.features?.length
        ? freeApi.features
        : ["Perfil completo do estudante", "Acompanhamento de progresso", "Comunicação com instituições", "Acesso a recursos educacionais", "Orientação vocacional básica", "Suporte por email"],
      color: "from-purple-500 to-pink-500",
      highlighted: false,
    },
    institutions: FALLBACK_INSTITUTIONS.map(f => mergePlan(f, apiPlans)),
    professionals: FALLBACK_PROFESSIONALS.map(f => mergePlan(f, apiPlans)),
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="label-pill text-primary/70 inline-block mb-3">Planos & Preços</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-none mb-4">
            Escolha o Plano{" "}
            <span className="gradient-text">Ideal</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-thin max-w-2xl mx-auto">
            Transparência e flexibilidade para cada etapa da jornada educacional
          </p>
        </div>

        {/* Families Plan */}
        <div className="mb-20">
          <span className="label-pill text-primary/70 block mb-3 text-center">Acesso Gratuito</span>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10 leading-none">Para Famílias</h2>
          <div className="max-w-lg mx-auto">
            <div className="group relative bg-card rounded-2xl p-6 sm:p-8 border-2 border-primary/25 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-primary/60 via-primary to-primary/60" />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ml-2">
                <plans.families.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="label-pill text-primary/70 block mb-2 ml-2">Famílias</span>
              <h3 className="text-2xl font-black mb-2 ml-2">{plans.families.title}</h3>
              <div className="text-5xl font-black mb-1 gradient-text leading-none ml-2">{plans.families.price}</div>
              <p className="text-sm text-muted-foreground font-thin mb-6 ml-2">{plans.families.description}</p>
              <ul className="space-y-2.5 mb-8 ml-2">
                {plans.families.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground font-thin">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="hero" className="w-full font-black" size="lg" onClick={() => handlePlanSelection('free', 'Gratuito')} disabled={authLoading || loadingPlan === 'free'}>
                {loadingPlan === 'free' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {(profile as any)?.plan === 'free' ? "Plano Atual" : "Começar Agora"}
              </Button>
            </div>
          </div>
        </div>

        {/* Institutions Plans */}
        <div className="mb-20">
          <span className="label-pill text-primary/70 block mb-3 text-center">Institucional</span>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10 leading-none">Para Instituições de Ensino</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {plans.institutions.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  plan.highlighted
                    ? "border-2 border-primary/50 hover:border-primary shadow-elegant"
                    : "border border-border/50 hover:border-primary/30"
                }`}
                style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both` }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300 ${
                  plan.highlighted ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/60"
                }`} />
                {plan.highlighted && (
                  <span className="label-pill bg-primary text-primary-foreground inline-block mb-4 ml-2">Mais Popular</span>
                )}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ml-2">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black mb-1 ml-2">{plan.name}</h3>
                <div className="flex items-baseline mb-1 ml-2">
                  <span className="text-4xl font-black gradient-text leading-none">{plan.price}</span>
                  <span className="text-muted-foreground font-thin ml-2 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground font-thin mb-5 ml-2">{plan.description}</p>
                <ul className="space-y-2 mb-7 ml-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground font-thin">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlighted ? "hero" : "outline"} className={`w-full ${plan.highlighted ? 'font-black' : 'font-thin'}`} size="lg" onClick={() => handlePlanSelection(plan.name, plan.price, plan.slug)} disabled={authLoading || loadingPlan === plan.name}>
                  {loadingPlan === plan.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {(profile as any)?.plan === plan.slug ? "Plano Atual" : `Escolher ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Professionals Plans */}
        <div className="mb-20">
          <span className="label-pill text-primary/70 block mb-3 text-center">Profissional</span>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10 leading-none">Para Profissionais de Apoio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {plans.professionals.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  plan.highlighted
                    ? "border-2 border-primary/50 hover:border-primary shadow-elegant"
                    : "border border-border/50 hover:border-primary/30"
                }`}
                style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both` }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300 ${
                  plan.highlighted ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/60"
                }`} />
                {plan.highlighted && (
                  <span className="label-pill bg-primary text-primary-foreground inline-block mb-4 ml-2">Recomendado</span>
                )}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ml-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black mb-1 ml-2">{plan.name}</h3>
                <div className="flex items-baseline mb-1 ml-2">
                  <span className="text-4xl font-black gradient-text leading-none">{plan.price}</span>
                  <span className="text-muted-foreground font-thin ml-2 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground font-thin mb-5 ml-2">{plan.description}</p>
                <ul className="space-y-2 mb-7 ml-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground font-thin">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlighted ? "hero" : "outline"} className={`w-full ${plan.highlighted ? 'font-black' : 'font-thin'}`} size="lg" onClick={() => handlePlanSelection(plan.name, plan.price, plan.slug)} disabled={authLoading || loadingPlan === plan.name}>
                  {loadingPlan === plan.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {(profile as any)?.plan === plan.slug ? "Plano Atual" : `Escolher ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ/Help Section */}
        <div className="relative max-w-3xl mx-auto text-center rounded-2xl p-12 overflow-hidden border border-border/50">
          <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
          <div className="relative">
            <span className="label-pill text-primary/70 inline-block mb-3">Suporte</span>
            <h3 className="text-3xl font-black mb-3 leading-tight">Dúvidas sobre os planos?</h3>
            <p className="text-muted-foreground font-thin mb-6">
              Nossa equipe está pronta para ajudar você a escolher o melhor plano para suas necessidades.
            </p>
            <Button variant="hero" size="lg" className="font-black">
              Falar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planos;