import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/api/supabase/client';
import { Loader2 } from 'lucide-react';
import CommissionManagement from '@/features/cpa/components/CommissionManagement';

const CommissionManagementPage = () => {
  const { profile } = useAuth();
  const [institutionalProfileId, setInstitutionalProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInstitutionalProfileId = async () => {
      if (profile && profile.profile_type?.includes('institutional')) {
        const { data, error } = await supabase
          .from('institutional_profiles')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (data) {
          setInstitutionalProfileId(data.id);
        }
      }
      setLoading(false);
    };

    if (profile) {
      getInstitutionalProfileId();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!institutionalProfileId) {
    return <div className="min-h-screen flex items-center justify-center"><p>Perfil institucional não encontrado.</p></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <CommissionManagement institutionalProfileId={institutionalProfileId} />
    </div>
  );
};

export default CommissionManagementPage;
