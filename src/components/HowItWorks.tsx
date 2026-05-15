import { Search, MessageCircle, BarChart3, BookOpen } from "lucide-react";
import element1 from "@/assets/home/Elemento - Como funciona 1.png";
import element2 from "@/assets/home/Elemento - Como funciona 2.png";
import element3 from "@/assets/home/Elemento - Como funciona 3.png";
import element4 from "@/assets/home/Elemento - Como funciona 4.png";

const steps = [
  {
    icon: Search,
    title: "Encontre",
    description: "Busque por instituições e especialistas que atendam às necessidades do estudante.",
    img: element1,
  },
  {
    icon: MessageCircle,
    title: "Conecte-se",
    description: "Conecte-se diretamente com escolas e profissionais de forma segura e transparente.",
    img: element2,
  },
  {
    icon: BarChart3,
    title: "Monitore",
    description: "Acompanhe o desenvolvimento educacional e socioemocional em tempo real.",
    img: element3,
  },
  {
    icon: BookOpen,
    title: "Desenvolva",
    description: "Utilize recursos educacionais e trilhas personalizadas para o desenvolvimento integral.",
    img: element4,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-28 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="label-pill text-primary/80 block mb-3">Passo a passo</span>
          <h2 className="text-5xl md:text-6xl gradient-text mb-4">Como Funciona</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light">
            Em passos simples, conectamos você ao ecossistema educacional completo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`animate-fade-in-up stagger-${index + 2} group relative`}
              >
                <div className="relative bg-card rounded-2xl p-7 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-elegant hover:-translate-y-1 overflow-hidden flex flex-col items-center text-center h-full">
                  {/* Big step number as background element */}
                  <span
                    className="absolute -top-3 -right-2 text-[7rem] font-black text-primary/5 select-none leading-none pointer-events-none"
                    aria-hidden
                  >
                    {index + 1}
                  </span>

                  {/* Small step indicator */}
                  <div className="flex items-center gap-2 mb-5 self-start">
                    <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                      {index + 1}
                    </span>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-28 h-28 mb-5 object-contain transition-transform duration-500 group-hover:scale-110"
                  />

                  <h3 className="text-xl mb-2 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector arrow between steps (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
