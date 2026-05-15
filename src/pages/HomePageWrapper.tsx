import { useAuth } from "@/features/auth/hooks/useAuth";
import Portal from "@/features/portal/pages/Portal";
import { Loader2, ArrowRight, Building2, Briefcase, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HowItWorks from "@/components/HowItWorks";
import ForWho from "@/components/ForWho";
import Testimonials from "@/components/Testimonials";

// Assets
import heroBg from "@/assets/home/fundo - primeira parte.png";
import cardEdital from "@/assets/homepagewrapper/Card Edital - Descubra sobre.png";
import cardProfissional from "@/assets/homepagewrapper/Card Profissional - Descubra Sobre.png";
import cardInstituicao from "@/assets/homepagewrapper/Instituições - Descubra sobre.png";
import ctaBg from "@/assets/home/Pronto para transformar a jornada educacional_ - fundo.png";

const solutions = [
  {
    img: cardInstituicao,
    icon: Building2,
    label: "Instituições",
    desc: "Gestão inteligente e conexão direta com sua comunidade acadêmica.",
    href: "/instituicoes",
    accentClass: "group-hover:border-violet-500/60",
    glowClass: "group-hover:shadow-[0_20px_60px_-12px_hsl(270_70%_60%/0.5)]",
  },
  {
    img: cardProfissional,
    icon: Briefcase,
    label: "Profissionais",
    desc: "Novas oportunidades e ferramentas para educadores e mentores.",
    href: "/profissionais",
    accentClass: "group-hover:border-indigo-500/60",
    glowClass: "group-hover:shadow-[0_20px_60px_-12px_hsl(245_75%_60%/0.5)]",
  },
  {
    img: cardEdital,
    icon: FileText,
    label: "Editais",
    desc: "Acesso simplificado a editais e oportunidades exclusivas.",
    href: "/editais",
    accentClass: "group-hover:border-blue-500/60",
    glowClass: "group-hover:shadow-[0_20px_60px_-12px_hsl(220_80%_60%/0.5)]",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative h-[90vh] min-h-[640px] w-full overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-[8000ms] hover:scale-100"
          style={{ backgroundImage: `url("${heroBg}")` }}
        />
        {/* Layered overlays for atmospheric depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {/* Violet glow on left to match brand */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,hsl(270_70%_55%/0.18)_0%,transparent_60%)]" />

        <div className="container relative h-full mx-auto px-4 flex flex-col justify-center items-start text-white">
          <div className="max-w-3xl space-y-6">
            {/* Label pill */}
            <div className="animate-fade-in-up stagger-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 backdrop-blur-sm">
              <GraduationCap className="h-3.5 w-3.5 text-violet-300" />
              <span className="label-pill text-violet-200">Ecossistema Educacional Digital</span>
            </div>

            {/* H1 — weight 900, tracking -0.04em set via h1 global styles */}
            <h1 className="animate-fade-in-up stagger-2 text-6xl md:text-8xl leading-[0.9] drop-shadow-2xl">
              Nenhum aluno<br />
              <span className="gradient-text">caminha sozinho.</span>
            </h1>

            {/* Subheading — thin weight contrasting with black headline */}
            <p className="animate-fade-in-up stagger-3 text-lg md:text-xl text-white/75 max-w-xl font-light leading-relaxed">
              Conectamos famílias, estudantes, instituições e profissionais
              em um único ecossistema educacional.
            </p>

            <div className="animate-fade-in-up stagger-4 flex flex-wrap gap-3 pt-2">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-glow-purple px-8 font-bold tracking-wide">
                  Começar agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white/10 backdrop-blur-sm px-8 font-light">
                  Ver planos
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-px h-12 rounded-full bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── Nossas Soluções ── */}
      <section className="relative py-28 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <span className="label-pill text-primary/80 block">O que oferecemos</span>
            <h2 className="text-5xl md:text-6xl gradient-text">Nossas Soluções</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light">
              Descubra como transformamos cada pilar do ecossistema educacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {solutions.map((item, i) => (
              <div
                key={item.label}
                className={`animate-scale-in stagger-${i + 2} group rounded-2xl overflow-hidden bg-card border border-border/40 transition-all duration-500 ${item.accentClass} ${item.glowClass} hover:-translate-y-2 flex flex-col`}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Icon badge */}
                  <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/15">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl mb-2 text-foreground">{item.label}</h3>
                  <p className="text-muted-foreground text-sm mb-5 flex-1 font-light leading-relaxed">{item.desc}</p>
                  <Link to={item.href}>
                    <Button variant="outline" className="w-full group-hover:border-primary/50 transition-colors">
                      Descubra sobre
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <HowItWorks />

      {/* ── Para Quem É ── */}
      <ForWho />

      {/* ── Depoimentos ── */}
      <Testimonials />

      {/* ── CTA Final ── */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: `url("${ctaBg}")` }}
        />
        {/* Stronger overlay with mesh gradient on top */}
        <div className="absolute inset-0 bg-primary/85 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_60%)] -z-10" />

        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-7">
            <span className="label-pill text-white/60 block">Junte-se ao ecossistema</span>
            <h2 className="text-5xl md:text-6xl text-white leading-tight">
              Pronto para transformar<br />
              <span className="font-light opacity-90">a jornada educacional?</span>
            </h2>
            <p className="text-lg text-white/75 font-light">
              Instituições, profissionais e famílias que já fazem parte da Enlaçados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/95 px-8 font-bold shadow-xl">
                  Começar Agora
                </Button>
              </Link>
              <Link to="/contato">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 font-light">
                  Falar com Especialista
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

const HomePageWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-background">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-glow-purple">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <p className="text-xs label-pill text-muted-foreground">Carregando</p>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Portal /> : <LandingPage />;
};

export default HomePageWrapper;
