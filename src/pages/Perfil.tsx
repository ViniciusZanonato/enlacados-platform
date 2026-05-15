import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/api/supabase/client";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
          .single();
        
        if (data) {
          setProfileId(data.id);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileId) {
    return <div className="min-h-screen flex items-center justify-center"><p>Perfil não encontrado.</p></div>;
  }

  return <UnifiedProfile profileId={profileId} />;
};

export default Perfil;