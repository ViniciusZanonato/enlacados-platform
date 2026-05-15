import { Target, Eye, Heart, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabase/client";

const Sobre = () => {
  const [counts, setCounts] = useState({ personal: 0, professional: 0, institutional: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const { data, error } = await supabase.rpc('get_profile_counts');
      if (error) {
        console.error("Error fetching profile counts:", error);
        return;
      }

      const newCounts = data.reduce((acc, item) => {
        acc[item.profile_type] = item.count;
        return acc;
      }, { personal: 0, professional: 0, institutional: 0 });

      setCounts(newCounts);
    };

    fetchCounts();
  }, []);
  const values = [
    {
      icon: Shield,
      title: "Transparência",
      description: "Informações claras e acessíveis para todos os usuários"
    },
    {
      icon: Zap,
      title: "Inovação",
      description: "Tecnologia de ponta para transformar a educação"
    },
    {
      icon: Heart,
      title: "Confiança",
      description: "Relações seguras e verificadas em nossa plataforma"
    },
    {
      icon: Target,
      title: "Impacto Social",
      description: "Educação de qualidade acessível para todos"
    },
    {
      icon: Users,
      title: "Colaboração",
      description: "Conexões fortes entre todos os envolvidos"
    },
    {
      icon: Eye,
      title: "Desenvolvimento Integral",
      description: "Foco no crescimento completo do estudante"
    }
  ];

  const team = [
    {
      name: "Vinicius Zanonato",
      role: "Co-Fundador",
      bio: "",
      avatar: "/vinicius.png"
    },
    {
      name: "Luiz Fernando Galvão",
      role: "Co-Fundador",
      bio: "",
      avatar: "/luiz.png"
    },
    {
      name: "Kauã Melo Pase",
      role: "Co-Fundador",
      bio: "",
      avatar: "/kaua.png"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent" />
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 60% 0%, hsl(270 80% 55% / 0.4) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="label-pill text-primary/70 inline-block mb-2 stagger-1" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
              Nossa história
            </span>
            <h1 className="text-6xl md:text-7xl leading-none stagger-2" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
              Propósito &{" "}
              <span className="gradient-text">Missão</span>
            </h1>
            <p className="text-xl text-muted-foreground font-thin max-w-2xl mx-auto stagger-3" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
              A Enlaçados é uma EdTech que conecta estudantes, famílias, instituições e profissionais em um ecossistema digital integrado — promovendo decisões educacionais conscientes e desenvolvimento integral.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full bg-primary/30 group-hover:bg-primary/70 transition-colors duration-300" />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ml-3">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <span className="label-pill text-primary/70 block mb-2 ml-3">Missão</span>
              <h2 className="text-3xl font-black leading-tight mb-4 ml-3">Nossa Missão</h2>
              <p className="text-muted-foreground leading-relaxed font-thin ml-3">
                Garantir que nenhum estudante caminhe sozinho, conectando e fortalecendo cada etapa da jornada educacional através de um ecossistema digital integrado que une famílias, instituições de ensino e profissionais de apoio.
              </p>
            </div>

            <div className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full bg-primary/30 group-hover:bg-primary/70 transition-colors duration-300" />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ml-3">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <span className="label-pill text-primary/70 block mb-2 ml-3">Visão</span>
              <h2 className="text-3xl font-black leading-tight mb-4 ml-3">Nossa Visão</h2>
              <p className="text-muted-foreground leading-relaxed font-thin ml-3">
                Ser a principal plataforma educacional do Brasil, reconhecida por democratizar o acesso à educação de qualidade e criar conexões significativas que transformam vidas e comunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <span className="label-pill text-primary/70 block mb-3 text-center">Linha do Tempo</span>
            <h2 className="text-5xl font-black text-center mb-12 leading-none">Nossa Jornada</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                A Enlaçados foi fundada em 2024, na Antonio Meneghetti Faculdade (AMF), por três sócios com a visão de criar um ecossistema educacional digital inclusivo e acessível. O projeto nasceu voltado a famílias de estudantes autistas, especialmente aquelas com recursos financeiros e acesso à internet limitados, oferecendo apoio personalizado e tecnológico para o desenvolvimento educacional.
              </p>
              <p>
                Com o passar do tempo, a Enlaçados evoluiu de uma iniciativa social para uma plataforma digital completa, que conecta famílias, escolas e profissionais de apoio em uma jornada educativa integrada e colaborativa.
              </p>
              <p>
                Em agosto de 2025, a Enlaçados foi incubada pela inovAMF, programa de inovação da AMF, fortalecendo sua estrutura tecnológica, seu modelo de negócios e sua rede de parcerias estratégicas.
              </p>
              <p>
                Atualmente, a Enlaçados se consolida como um ecossistema educacional inovador, que promove inclusão, impacto social e desenvolvimento integral dos estudantes, acompanhando-os da escolha da escola ao crescimento socioemocional e profissional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <span className="label-pill text-primary/70 block mb-3 text-center">Princípios</span>
          <h2 className="text-5xl font-black text-center mb-3 leading-none">Nossos Valores</h2>
          <p className="text-center text-muted-foreground font-thin mb-12 max-w-2xl mx-auto">
            Princípios que guiam cada decisão e ação na Enlaçados
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative bg-card rounded-2xl p-7 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                style={{ animation: `scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s both` }}
              >
                <div className="absolute left-0 top-5 bottom-5 w-0.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors duration-300" />
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ml-3">
                  <value.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black mb-2 ml-3">{value.title}</h3>
                <p className="text-sm text-muted-foreground font-thin ml-3">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <span className="label-pill text-primary/70 block mb-3 text-center">Fundadores</span>
          <h2 className="text-5xl font-black text-center mb-3 leading-none">Nossa Equipe</h2>
          <p className="text-center text-muted-foreground font-thin mb-12 max-w-2xl mx-auto">
            Profissionais apaixonados por educação e tecnologia
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl p-6 text-center border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both` }}
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300 object-cover"
                />
                <h3 className="text-lg font-black mb-1">{member.name}</h3>
                <span className="label-pill text-primary/70 inline-block">{member.role}</span>
                {member.bio && <p className="text-sm text-muted-foreground font-thin mt-2">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <span className="label-pill text-primary/70 block mb-3 text-center">Números Reais</span>
          <h2 className="text-5xl font-black text-center mb-12 leading-none">Nosso Impacto</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { number: counts.personal || "0", label: "Famílias Conectadas" },
              { number: counts.institutional || "0", label: "Instituições Parceiras" },
              { number: counts.professional || "0", label: "Profissionais Cadastrados" },
              { number: counts.personal || "0", label: "Estudantes Beneficiados" }
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center"
                style={{ animation: `scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s both` }}
              >
                <div className="text-6xl font-black gradient-text mb-2 leading-none">{stat.number}</div>
                <div className="text-sm text-muted-foreground font-thin tracking-wide uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="label-pill text-primary-foreground/60 inline-block mb-2">Faça parte</span>
            <h2 className="text-5xl md:text-6xl font-black leading-none text-primary-foreground">
              Junte-se à nossa missão
            </h2>
            <p className="text-xl text-primary-foreground/70 font-thin">
              Faça parte da transformação educacional que está impactando milhares de vidas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/planos">
                <Button variant="secondary" size="lg" className="font-black">
                  Começar Agora
                </Button>
              </Link>
              <Link to="/contato">
                <Button variant="outline" size="lg" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-thin">
                  Entre em Contato
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;