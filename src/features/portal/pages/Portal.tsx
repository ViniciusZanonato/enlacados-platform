import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader2, GraduationCap, BookOpen, ArrowRight, Building2, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchInstitutions, fetchCourses, fetchProfessionals } from "@/services/portal";

// Assets
import bannerHero from "@/assets/homepagewrapper/Banner - Bem vindo - Enlaçados.png";
import cardEdital from "@/assets/homepagewrapper/Card Edital - Descubra sobre.png";
import cardProfissional from "@/assets/homepagewrapper/Card Profissional - Descubra Sobre.png";
import cardInstituicao from "@/assets/homepagewrapper/Instituições - Descubra sobre.png";

interface RecommendedInstitution { id: string; name: string; type: string; }
interface RecommendedCourse     { id: string; name: string; institution: string; institutionalProfileId: string; }
interface RecommendedProfessional { id: string; name: string; specialty: string; }

const DiscoverCard = ({
  href, img, label, glow,
}: { href: string; img: string; label: string; glow: string; }) => (
  <Link to={href} className="group block">
    <div className={`relative overflow-hidden rounded-2xl aspect-[16/9] shadow-elegant transition-all duration-500 ${glow} hover:-translate-y-2`}>
      <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <span className="label-pill text-white/80 block">{label}</span>
      </div>
    </div>
  </Link>
);

type ItemCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  index: number;
};
const ItemCard = ({ icon, title, subtitle, href, index }: ItemCardProps) => (
  <div
    className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} group bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/40 hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center text-center`}
  >
    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <h4 className="font-bold text-sm text-foreground mb-1 leading-snug">{title}</h4>
    <p className="text-xs text-muted-foreground font-light mb-4 line-clamp-2">{subtitle}</p>
    <Link to={href} className="mt-auto w-full">
      <Button variant="outline" size="sm" className="w-full text-xs group-hover:border-primary/50 transition-colors">
        Ver mais
      </Button>
    </Link>
  </div>
);

const Portal = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: recommendedInstitutions = [], isLoading: isLoadingInstitutions } = useQuery<RecommendedInstitution[]>({
    queryKey: ['recommendedInstitutions'],
    queryFn: fetchInstitutions,
    enabled: !authLoading && !!user,
  });

  const { data: recommendedCourses = [], isLoading: isLoadingCourses } = useQuery<RecommendedCourse[]>({
    queryKey: ['recommendedCourses'],
    queryFn: fetchCourses,
    enabled: !authLoading && !!user,
  });

  const { data: recommendedProfessors = [], isLoading: isLoadingProfessors } = useQuery<RecommendedProfessional[]>({
    queryKey: ['recommendedProfessors', 'Professor'],
    queryFn: () => fetchProfessionals(['Professor']),
    enabled: !authLoading && !!user,
  });

  const { data: recommendedPsicopedagogos = [], isLoading: isLoadingPsicopedagogos } = useQuery<RecommendedProfessional[]>({
    queryKey: ['recommendedPsicopedagogos', 'Psicopedagogo'],
    queryFn: () => fetchProfessionals(['Psicopedagogo']),
    enabled: !authLoading && !!user,
  });

  const loading = isLoadingInstitutions || isLoadingCourses || isLoadingProfessors || isLoadingPsicopedagogos;

  const firstName = profile?.full_name?.split(" ")[0] ?? "Bem-vindo";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-background">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-glow-purple">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <p className="label-pill text-muted-foreground">Carregando</p>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[480px] lg:min-h-[60vh] flex items-center w-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${bannerHero}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,hsl(270_70%_55%/0.15)_0%,transparent_60%)]" />

        <div className="container relative mx-auto px-4 flex flex-col justify-center items-start text-white">
          <div className="max-w-2xl space-y-4">
            {/* Thin greeting — weight contrast with name */}
            <p className="animate-fade-in-up stagger-1 text-lg text-white/60 font-light tracking-wide">
              {greeting},
            </p>
            {/* Name — 900 weight from global h1 style */}
            <h1 className="animate-fade-in-up stagger-2 text-5xl md:text-7xl leading-none drop-shadow-xl">
              {firstName}<span className="text-primary">.</span>
            </h1>
            <p className="animate-fade-in-up stagger-3 text-base md:text-lg text-white/75 max-w-md font-light leading-relaxed">
              Explore instituições, cursos e profissionais. Tudo num só ecossistema.
            </p>
            <div className="animate-fade-in-up stagger-4 flex flex-wrap gap-3 pt-2">
              <Link to="/portal">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-glow-purple px-8 font-bold">
                  Ir para meu portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/instituicoes">
                <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white/10 backdrop-blur-sm px-8 font-light">
                  Explorar cursos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Descubra Sobre ── */}
      <section className="py-20 bg-card relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-12">
            <span className="label-pill text-primary/70 block mb-2">Explore o ecossistema</span>
            <h2 className="text-4xl md:text-5xl text-foreground">Descubra Sobre</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <DiscoverCard href="/instituicoes" img={cardInstituicao} label="Instituições" glow="hover:shadow-glow-purple" />
            <DiscoverCard href="/editais"      img={cardEdital}      label="Editais"      glow="hover:shadow-glow-blue" />
            <DiscoverCard href="/profissionais" img={cardProfissional} label="Profissionais" glow="hover:shadow-glow-indigo" />
          </div>
        </div>
      </section>

      {/* ── Recomendados — Cursos & Instituições ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <span className="label-pill text-primary/70 block mb-2">Para você</span>
          <h2 className="text-4xl md:text-5xl gradient-text mb-12">Cursos & Instituições</h2>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {recommendedCourses.length > 0 && (
                <>
                  <h3 className="text-base font-bold mb-5 text-muted-foreground label-pill tracking-widest">CURSOS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                    {recommendedCourses.map((course, i) => (
                      <ItemCard
                        key={course.id}
                        index={i}
                        icon={<BookOpen className="w-6 h-6 text-primary" />}
                        title={course.name}
                        subtitle={course.institution}
                        href={`/perfil/${course.institutionalProfileId}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {recommendedInstitutions.length > 0 && (
                <>
                  <h3 className="text-base font-bold mb-5 text-muted-foreground label-pill tracking-widest">INSTITUIÇÕES</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {recommendedInstitutions.map((inst, i) => (
                      <ItemCard
                        key={inst.id}
                        index={i}
                        icon={<Building2 className="w-6 h-6 text-primary" />}
                        title={inst.name}
                        subtitle={inst.type}
                        href={`/perfil/${inst.id}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Profissionais Recomendados ── */}
      <section className="py-20 bg-card relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <span className="label-pill text-primary/70 block mb-2">Especialistas</span>
          <h2 className="text-4xl md:text-5xl gradient-text mb-12">Profissionais Recomendados</h2>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {recommendedProfessors.length > 0 && (
                <>
                  <h3 className="text-base font-bold mb-5 text-muted-foreground label-pill tracking-widest">PROFESSORES</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                    {recommendedProfessors.slice(0, 4).map((prof, i) => (
                      <ItemCard
                        key={prof.id}
                        index={i}
                        icon={
                          <span className="text-primary font-black text-lg">
                            {prof.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                        }
                        title={prof.name}
                        subtitle={prof.specialty}
                        href={`/perfil/${prof.id}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {recommendedPsicopedagogos.length > 0 && (
                <>
                  <h3 className="text-base font-bold mb-5 text-muted-foreground label-pill tracking-widest">PSICOPEDAGOGOS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {recommendedPsicopedagogos.map((prof, i) => (
                      <ItemCard
                        key={`psico-${prof.id}`}
                        index={i}
                        icon={
                          <span className="text-primary font-black text-lg">
                            {prof.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                        }
                        title={prof.name}
                        subtitle={prof.specialty}
                        href={`/perfil/${prof.id}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Portal;
