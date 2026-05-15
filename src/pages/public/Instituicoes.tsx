import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

interface InstitutionalProfile {
  id: string;
  full_name: string;
  profile_type: string;
  institutional_profiles: {
    description: string;
    institution_name: string;
  } | null;
}

const Instituicoes = () => {
  const [institutions, setInstitutions] = useState<InstitutionalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, profile_type, institutional_profiles(description, institution_name)')
          .eq('profile_type', 'institutional');

        if (error) {
          handleSupabaseError(error as PostgrestError, "Erro ao carregar instituições.");
          return;
        }

        setInstitutions(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="label-pill text-primary/70 inline-block mb-3">Busca</span>
          <h1 className="text-5xl font-black leading-none mb-3 gradient-text">
            Instituições de Ensino
          </h1>
          <p className="text-muted-foreground font-thin">
            Encontre a instituição ideal para sua jornada educacional
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-glow transition-smooth"
              >
                <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {institution.full_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {institution.institutional_profiles?.institution_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {institution.institutional_profiles?.description}
                </p>
                <Link to={`/perfil/${institution.id}`} className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Instituicoes;