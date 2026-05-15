import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { Star, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  full_name: string;
  avatar_url: string;
  profile_type: string;
  institutional_profiles: { description: string } | null;
  professional_profiles: { bio: string } | null;
  personal_profiles: { bio: string } | null;
  text: string;
  role: string;
  rating: number;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, profile_type, institutional_profiles(description), professional_profiles(bio), personal_profiles(bio)');

        if (error) throw error;

        const namesToExclude = ['teste', 'teste 2'];

        const filteredData = data.filter(p => {
          const fullNameLower = p.full_name.toLowerCase();
          return !namesToExclude.includes(fullNameLower);
        });

        const formattedTestimonials = filteredData.map(p => {
          const text = `Um membro valioso da comunidade Enlaçados, contribuindo como ${p.profile_type}.`;
          return {
            ...p,
            text,
            role: p.profile_type.charAt(0).toUpperCase() + p.profile_type.slice(1),
            rating: 5,
          };
        }).slice(0, 3);

        setTestimonials(formattedTestimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section className="py-28 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Subtle mesh glow in the background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(270_70%_55%/0.10)_0%,transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span className="label-pill text-primary/80 block mb-3">Comunidade</span>
          <h2 className="text-5xl md:text-6xl gradient-text mb-4">O Que Dizem Sobre Nós</h2>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <p className="text-muted-foreground font-light">4.8/5 de satisfação</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`animate-fade-in-up stagger-${index + 2} group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-elegant hover:-translate-y-1 overflow-hidden`}
              >
                {/* Dramatic quotation mark as background element */}
                <span
                  className="absolute -top-4 -left-2 text-[9rem] font-black text-primary/6 leading-none select-none pointer-events-none"
                  aria-hidden
                >
                  "
                </span>

                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 italic font-light leading-relaxed line-clamp-4 relative z-10">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <Avatar className="w-11 h-11 ring-2 ring-primary/20">
                    <AvatarImage src={testimonial.avatar_url} alt={testimonial.full_name} />
                    <AvatarFallback className="text-sm font-bold">
                      {testimonial.full_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-foreground leading-none mb-1">
                      {testimonial.full_name}
                    </h4>
                    <p className="label-pill text-muted-foreground capitalize">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
