import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CommissionManagement = ({ institutionalProfileId }) => {
  const [commission, setCommission] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newMemberRole, setNewMemberRole] = useState('Membro');

  const fetchCommissionAndMembers = useCallback(async () => {
    setLoading(true);
    // First, get the latest commission for the institution
    const { data: commissionData, error: commissionError } = await supabase
      .from('cpa_commissions')
      .select('*')
      .eq('institutional_profile_id', institutionalProfileId)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (commissionError && commissionError.code !== 'PGRST116') { // Ignore 'single row not found'
      toast.error("Erro ao buscar a comissão CPA: " + commissionError.message);
      setLoading(false);
      return;
    }
    setCommission(commissionData);

    if (commissionData) {
      // Now, get the members of that commission
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_cpa_commission_members', { commission_id: commissionData.id });

      if (membersError) {
        toast.error("Erro ao buscar os membros da comissão: " + membersError.message);
      } else {
        setMembers(membersData);
      }
    }
    setLoading(false);
  }, [institutionalProfileId]);

  useEffect(() => {
    if (institutionalProfileId) {
      fetchCommissionAndMembers();
    }
  }, [institutionalProfileId, fetchCommissionAndMembers]);

  const handleSearch = async () => {
    if (searchTerm.trim().length < 3) {
      toast.info("Digite pelo menos 3 caracteres para buscar.");
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .ilike('full_name', `%${searchTerm}%`);

    if (error) {
      toast.error("Erro ao buscar usuários: " + error.message);
    } else {
      setSearchResults(data);
    }
  };

  const handleAddMember = async (profileId) => {
    const { error } = await supabase.rpc('add_cpa_commission_member', {
      p_commission_id: commission.id,
      p_profile_id: profileId,
      p_role: newMemberRole
    });

    if (error) {
      toast.error("Erro ao adicionar membro: " + error.message);
    } else {
      toast.success("Membro adicionado com sucesso!");
      fetchCommissionAndMembers(); // Refresh members list
      setSearchResults([]);
      setSearchTerm('');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const { error } = await supabase.rpc('remove_cpa_commission_member', { p_member_id: memberId });

    if (error) {
      toast.error("Erro ao remover membro: " + error.message);
    } else {
      toast.success("Membro removido com sucesso!");
      fetchCommissionAndMembers(); // Refresh members list
    }
  };

  if (loading) {
    return <Loader2 className="w-8 h-8 animate-spin mx-auto mt-8" />;
  }

  if (!commission) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestão da Comissão CPA</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Nenhuma comissão CPA encontrada para esta instituição.</p>
                {/* TODO: Add a button to create a new commission */}
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Membros da Comissão CPA</CardTitle>
          <CardDescription>Período de vigência: {new Date(commission.start_date).toLocaleDateString()} - {new Date(commission.end_date).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length > 0 ? (
            members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>{member.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">Nenhum membro na comissão.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Membro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar usuário por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}><Search className="w-4 h-4"/></Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 pt-4">
                <Label>Resultados da Busca</Label>
                {searchResults.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{profile.full_name}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Papel do membro"
                                defaultValue="Membro"
                                onChange={(e) => setNewMemberRole(e.target.value)}
                                className="w-36"
                            />
                            <Button onClick={() => handleAddMember(profile.id)} size="icon"><UserPlus className="w-4 h-4"/></Button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionManagement;
