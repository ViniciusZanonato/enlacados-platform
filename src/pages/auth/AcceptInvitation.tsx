
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const AcceptInvitation = () => {
  const { institution_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutionName = async () => {
      if (!institution_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('institutional_profiles')
          .select('institution_name')
          .eq('id', institution_id)
          .single();

        if (error) throw error;
        setInstitutionName(data.institution_name);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        toast.error(`Erro ao carregar informações da instituição: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionName();
  }, [institution_id]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_invitation', { p_institution_profile_id: institution_id });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      toast.success(`Convite para ${institutionName} aceito com sucesso!`);
      
      // Invalidate both queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkedStudents'] }), // For institutional portal
        queryClient.invalidateQueries({ queryKey: ['linkedInstitutions', profile?.cpf] }) // For student portal
      ]);

      navigate('/portal');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      toast.error(`Erro ao aceitar convite: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('decline_invitation', { p_institution_profile_id: institution_id });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      toast.success('Convite recusado.');
      await queryClient.invalidateQueries({ queryKey: ['linkedStudents'] });
      navigate('/portal');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      toast.error(`Erro ao recusar convite: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite para se Juntar</CardTitle>
          <CardDescription>
            A instituição <strong>{institutionName}</strong> convidou você para se juntar à sua comunidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleDecline}>Recusar</Button>
          <Button onClick={handleAccept}>Aceitar</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
