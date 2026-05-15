import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/api/supabase/client";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, UserX, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnifiedProfile from "@/features/profile/components/UnifiedProfile";

const Perfil = () => {
  const { id: urlId } = useParams<{ id: string }>(); // Get ID from URL if it exists
  const { user, loading: authLoading } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfileId = async () => {
      setLoading(true);
      if (urlId) {
        // If there's an ID in the URL, use it directly
        setProfileId(urlId);
        setLoading(false);
      } else if (user) {
        // If no ID in URL, fetch the logged-in user's profile ID
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (data && data.length > 0) {
          setProfileId(data[0].id);
        }
        setLoading(false);
      }
    };

    if (!authLoading) {
      getProfileId();
    }
  }, [user, authLoading, urlId]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-background">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <UserX className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Perfil não encontrado</h2>
        <p className="text-sm text-muted-foreground">Este perfil não existe ou não está disponível.</p>
        <Button variant="outline" asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  return <UnifiedProfile profileId={profileId} />;
};

export default Perfil;