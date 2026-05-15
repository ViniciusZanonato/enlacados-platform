import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { Users, Building2, Briefcase, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import studentsImg from "@/assets/home/Para quem é a Enlaçados_ - Estudantes .png";
import institutionsImg from "@/assets/home/Para quem é a Enlaçados_ - Instituições .png";
import professionalsImg from "@/assets/home/Para quem é a Enlaçados_ - Profissionais.png";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  profile_type: string;
  description: string;
  institutional_profiles: { description: string } | null;
  professional_profiles: { title: string } | null;
  personal_profiles: { bio: string } | null;
}

const cards = [
  {
    type: 'personal',
    title: 'Estudantes',
    description: 'Conecte-se com instituições e profissionais para impulsionar sua jornada educacional.',
    img: studentsImg,
    link: '/jornada',
    Icon: Users,
    accent: 'from-violet-500/20',
  },
  {
    type: 'institutional',
    title: 'Instituições',
    description: 'Alcance mais estudantes e profissionais, gerencie processos e amplie seu impacto.',
    img: institutionsImg,
    link: '/instituicoes',
    Icon: Building2,
    accent: 'from-indigo-500/20',
  },
  {
    type: 'professional',
    title: 'Profissionais',
    description: 'Compartilhe seu conhecimento, encontre oportunidades e mentoreie novos talentos.',
    img: professionalsImg,
    link: '/profissionais',
    Icon: Briefcase,
    accent: 'from-blue-500/20',
  },
];

const ForWho = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Profiles are loaded elsewhere; we just need the images — skip DB call
    setLoading(false);
  }, []);

  return (
    <section className="py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="label-pill text-primary/80 block mb-3">Para todos</span>
          <h2 className="text-5xl md:text-6xl gradient-text mb-4">Para Quem é a Enlaçados?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light">
            Uma plataforma completa para todos os envolvidos na jornada educacional
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {cards.map((item, index) => (
              <div
                key={item.type}
                className={`animate-scale-in stagger-${index + 2} group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-elegant hover:-translate-y-1`}
              >
                {/* Image with overlay */}
                <div className="relative h-60 w-full overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-107"
                  />
                  {/* Gradient overlay fading into card bg */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.accent} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

                  {/* Icon badge */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl px-3 py-1.5">
                    <item.Icon className="w-4 h-4 text-primary" />
                    <span className="label-pill text-foreground/80">{item.title}</span>
                  </div>
                </div>

                <div className="p-7">
                  <p className="text-muted-foreground mb-6 font-light leading-relaxed">
                    {item.description}
                  </p>
                  <Link to={item.link}>
                    <Button variant="outline" className="w-full group/btn hover:border-primary/50 transition-colors">
                      Saiba Mais
                      <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ForWho;
