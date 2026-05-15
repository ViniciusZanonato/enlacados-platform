import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Briefcase, Loader2, Star, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

interface ProfessionalProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  profile_type: string;
  professional_profiles: {
    bio: string;
    title: string;
    profession: string;
    other_profession?: string;
  } | null;
}

const professionsList = [
  "Professor(a)",
  "Psicopedagogo(a)",
  "Coordenador(a) Pedagógico(a)",
  "Diretor(a) Escolar",
  "Orientador(a) Educacional",
  "Supervisor(a) de Ensino",
  "Tradutor(a) e Intérprete de Libras",
  "Psicólogo(a) Escolar",
  "Fonoaudiólogo(a) Educacional",
  "Terapeuta Ocupacional",
];

const Profissionais = () => {
  const { profile } = useAuth();
  const [allFetchedProfessionals, setAllFetchedProfessionals] = useState<ProfessionalProfile[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<ProfessionalProfile[]>([]);
  const [recommendedProfessionals, setRecommendedProfessionals] = useState<ProfessionalProfile[]>([]);
  const [otherProfessionalsGroup, setOtherProfessionalsGroup] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('all');

  const isPremiumUser = profile?.plan === 'premium';

  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      try {
        const query = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, profile_type, professional_profiles(bio, title, profession, other_profession)')
          .eq('profile_type', 'professional');

        const { data, error } = await query;

        if (error) {
          handleSupabaseError(error as PostgrestError, "Erro ao carregar profissionais.");
          return;
        }

        setAllFetchedProfessionals(data || []);

      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  useEffect(() => {
    let currentProfessionals = allFetchedProfessionals;

    // Apply search term filter
    if (searchTerm) {
      currentProfessionals = currentProfessionals.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply profession filter
    if (selectedProfession && selectedProfession !== 'all') {
      currentProfessionals = currentProfessionals.filter(p =>
        p.professional_profiles?.profession === selectedProfession
      );
    }

    const newRecommended: ProfessionalProfile[] = [];
    const newOtherProfGroup: ProfessionalProfile[] = [];
    const newFiltered: ProfessionalProfile[] = [];

    currentProfessionals.forEach(p => {
      const profession = p.professional_profiles?.profession;
      if (profession === 'Professor(a)' || profession === 'Psicopedagogo(a)') {
        newRecommended.push(p);
      } else if (profession === 'Outro') {
        newOtherProfGroup.push(p);
      } else {
        newFiltered.push(p);
      }
    });

    setRecommendedProfessionals(newRecommended);
    setOtherProfessionalsGroup(newOtherProfGroup);
    setFilteredProfessionals(newFiltered);

  }, [searchTerm, selectedProfession, allFetchedProfessionals]);

  const renderProfessionalCard = (professional: ProfessionalProfile, isRecommended: boolean = false) => (
    <div
      key={professional.id}
      className={`bg-card rounded-2xl p-6 border ${isRecommended ? 'border-2 border-yellow-400/50 shadow-glow-yellow' : 'border-border hover:shadow-glow'} transition-smooth`}
    >
      <Avatar className="w-16 h-16 mx-auto mb-4">
        <AvatarImage src={professional.avatar_url} alt={professional.full_name} />
        <AvatarFallback>{professional.full_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <h3 className="text-xl font-bold mb-2 text-foreground text-center">
        {professional.full_name}
      </h3>
      <p className="text-sm font-semibold text-muted-foreground mb-1 text-center">
        {professional.professional_profiles?.profession === 'Outro'
          ? professional.professional_profiles?.other_profession
          : professional.professional_profiles?.profession}
      </p>
      <p className="text-sm text-muted-foreground text-center">
        {professional.professional_profiles?.bio}
      </p>
      <Link to={`/perfil/${professional.id}`} className="mt-4">
        <Button variant="outline" size="sm" className="w-full">
          Ver Perfil
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="label-pill text-primary/70 inline-block mb-3">Busca</span>
          <h1 className="text-5xl font-black leading-none mb-3 gradient-text">
            Profissionais de Apoio
          </h1>
          <p className="text-muted-foreground font-thin">
            Encontre o profissional ideal para suas necessidades
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por profissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Profissões</SelectItem>
              {professionsList.map((prof) => (
                <SelectItem key={prof} value={prof}>
                  {prof}
                </SelectItem>
              ))}
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Filtered Professionals Section (appears right below search bar) */}
            {filteredProfessionals.length > 0 && selectedProfession !== 'all' && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Profissionais Encontrados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProfessionals.map((professional) => renderProfessionalCard(professional))}
                </div>
              </div>
            )}

            {/* Recommended Professionals Section */}
            {isPremiumUser && recommendedProfessionals.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-400 mr-4" />
                  Profissionais Recomendados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendedProfessionals.map((professional) => renderProfessionalCard(professional, true))}
                </div>
              </div>
            )}

            {/* All Professionals Section (if no specific filter is active or after specific filtered) */}
            {filteredProfessionals.length > 0 && selectedProfession === 'all' && (
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        Todos os Profissionais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProfessionals.map((professional) => renderProfessionalCard(professional))}
                    </div>
                </div>
            )}

            {/* Other Professionals Section */}
            {otherProfessionalsGroup.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        Outros Profissionais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherProfessionalsGroup.map((professional) => renderProfessionalCard(professional))}
                    </div>
                </div>
            )}

            {!loading && allFetchedProfessionals.length === 0 && (
              <p className="text-center text-muted-foreground text-lg">
                Nenhum profissional encontrado.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profissionais;