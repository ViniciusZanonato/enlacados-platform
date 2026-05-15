import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CalendarIcon, Pencil, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import UserSearchInput from "@/components/UserSearchInput";

interface CommissionMember {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Commission {
  id: string;
  institutional_profile_id: string;
  start_date: string;
  end_date: string;
}

interface MemberData {
  id: string;
  profile_id: string;
  role: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const CPACommissionManagement = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInstitutional, setIsInstitutional] = useState(false);
  const [institutionalProfileId, setInstitutionalProfileId] = useState<string | null>(null);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [members, setMembers] = useState<CommissionMember[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isEditingMandate, setIsEditingMandate] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (authLoading) return;

        if (!profile) {
          setIsInstitutional(false);
          return;
        }

        if (!profile.profile_type?.includes("institutional")) {
          setIsInstitutional(false);
          return;
        }

        setIsInstitutional(true);

        // Ensure the specific profile record exists before trying to fetch it.
        const { error: rpcError } = await supabase.rpc('ensure_specific_profile_exists');
        if (rpcError) {
          console.error('Error ensuring profile exists:', rpcError);
          toast.error(`Falha ao verificar o perfil: ${rpcError.message}`);
          throw rpcError;
        }

        const { data: instProfile, error: instError } = await supabase
          .from("institutional_profiles")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (instError) {
          toast.error(`Erro ao carregar perfil institucional: ${instError.message}`);
          throw instError;
        }

        if (!instProfile) {
            toast.error("Perfil institucional não encontrado após a verificação.");
            return;
        }

        setInstitutionalProfileId(instProfile.id);

        const { data: commissionData, error: commissionError } = await supabase
          .from("cpa_commissions")
          .select("*")
          .eq("institutional_profile_id", instProfile.id);

        if (commissionError) {
            toast.error(`Erro ao carregar comissão: ${commissionError.message}`);
            throw commissionError;
        }

        if (commissionData && commissionData.length > 0) {
          const commission = commissionData[0];
          setCommission(commission);
          const sDate = new Date(commission.start_date);
          const eDate = new Date(commission.end_date);
          setStartDate(sDate);
          setEndDate(eDate);
          setTempStartDate(sDate);
          setTempEndDate(eDate);
        } else {
          // No commission found, reset state
          setCommission(null);
          setMembers([]);
          setStartDate(undefined);
          setEndDate(undefined);
          setTempStartDate(undefined);
          setTempEndDate(undefined);
        }

      } catch (error) {
        // Errors are already toasted inside the try block
        console.error("An error occurred during initial data load:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [profile, authLoading]); // Add authLoading to dependencies

  const fetchMembers = useCallback(async () => {
    if (commission?.id) {
      setMembersLoading(true);
      try {
        const { data: membersData, error: membersError } = await supabase
          .from("cpa_commission_members")
          .select("id, profile_id, role, profiles(full_name, email)")
          .eq("commission_id", commission.id);

        if (membersError) throw membersError;

        setMembers(membersData.map((member: MemberData) => ({
          id: member.id,
          profile_id: member.profile_id,
          full_name: member.profiles.full_name,
          email: member.profiles.email,
          role: member.role,
        })) || []);
      } catch (error: Error) {
        console.error("Error fetching CPA commission members:", error.message);
        toast.error("Erro ao carregar membros da comissão CPA.");
      } finally {
        setMembersLoading(false);
      }
    } else {
      setMembers([]);
    }
  }, [commission?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]); // Depends on commission ID



  const handleSaveCommission = async () => {
    if (!tempStartDate || !tempEndDate) {
      toast.error("As datas de início e fim são obrigatórias.");
      return;
    }
    if (!institutionalProfileId) {
      toast.error("Perfil institucional não encontrado.");
      return;
    }

    setSaving(true);
    try {
      const commissionData = {
        institutional_profile_id: institutionalProfileId,
        start_date: format(tempStartDate, "yyyy-MM-dd"),
        end_date: format(tempEndDate, "yyyy-MM-dd"),
      };

      if (commission) {
        const { error } = await supabase
          .from("cpa_commissions")
          .update(commissionData)
          .eq("id", commission.id);
        if (error) throw error;
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        toast.success("Comissão atualizada com sucesso!");
      } else {
        const { data, error } = await supabase
          .from("cpa_commissions")
          .insert(commissionData)
          .select()
          .single();
        if (error) throw error;
        setCommission(data);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        toast.success("Comissão criada com sucesso!");
      }
      setIsEditingMandate(false);

    } catch (error: unknown) {
      console.error("Error saving commission:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      toast.error(`Erro ao salvar comissão: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditMandate = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsEditingMandate(false);
  }

  const handleAddMember = async () => {
    if (!newMemberEmail || !newMemberRole) {
      toast.error("Email e função do membro são obrigatórios.");
      return;
    }
    if (!commission) {
      toast.error("Crie a comissão antes de adicionar membros.");
      return;
    }

    setSaving(true);
    try {
      // Find the profile_id for the given email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", newMemberEmail)
        .single();

      if (profileError || !profileData) {
        throw new Error("Usuário com este email não encontrado.");
      }

      // Check if member already exists
      if (members.some(m => m.profile_id === profileData.id)) {
        throw new Error("Este membro já faz parte da comissão.");
      }

      const { error } = await supabase
        .from("cpa_commission_members")
        .insert({
          commission_id: commission.id,
          profile_id: profileData.id,
          role: newMemberRole,
        });

      if (error) throw error;

      toast.success(`"${profileData.full_name}" foi adicionado à comissão.`);
      setNewMemberEmail("");
      setNewMemberRole("");
      fetchMembers(); // Refresh the member list
    } catch (error: Error) {
      console.error("Error adding member:", error.message);
      toast.error(error.message || "Erro ao adicionar membro.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("cpa_commission_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Membro removido com sucesso.");
      fetchMembers(); // Refresh the member list
    } catch (error: Error) {
      console.error("Error removing member:", error.message);
      toast.error("Erro ao remover membro.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInstitutional && !authLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Você não tem permissão para gerenciar a comissão CPA.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Commission Mandate Section */}
      <div className="p-6 border rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mandato da Comissão</h2>
          {!isEditingMandate ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditingMandate(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveCommission} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEditMandate} disabled={saving}>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {isEditingMandate ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDatePicker">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDatePicker"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !tempStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempStartDate ? format(tempStartDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={tempStartDate} onSelect={setTempStartDate} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDatePicker">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDatePicker"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !tempEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempEndDate ? format(tempEndDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={tempEndDate} onSelect={setTempEndDate} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-sm text-muted-foreground">Data de Início</Label>
              <p className="font-semibold text-base mt-1">{startDate ? format(startDate, "PPP", { locale: ptBR }) : 'Não definida'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Data de Fim</Label>
              <p className="font-semibold text-base mt-1">{endDate ? format(endDate, "PPP", { locale: ptBR }) : 'Não definida'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Commission Members Section */}
      <div className="p-6 border rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Membros da Comissão
            {membersLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          {!isEditingMembers ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditingMembers(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Gerenciar Membros
            </Button>
          ) : (
            <Button size="sm" onClick={() => setIsEditingMembers(false)}>
                <Check className="mr-2 h-4 w-4" /> Concluído
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {members.length === 0 && !membersLoading ? (
            <p className="text-muted-foreground text-center py-4">Nenhum membro adicionado ainda.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-md transition-all hover:bg-gray-50">
                <div>
                  <p className="font-medium">{member.full_name || member.email}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                {isEditingMembers &&
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} disabled={saving}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                }
              </div>
            ))
          )}
        </div>

        {isEditingMembers && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Adicionar Novo Membro</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow">
                <Label htmlFor="newMemberEmail" className="mb-2 block">Email do novo membro</Label>
                <UserSearchInput
                  value={newMemberEmail}
                  onChange={setNewMemberEmail}
                  onSelectUser={(user) => setNewMemberEmail(user.email)}
                  placeholder="Digite para buscar..."
                  disabled={saving}
                />
              </div>
              <div className="w-full md:w-64">
                <Label htmlFor="newMemberRole" className="mb-2 block">Função</Label>
                <Input
                  id="newMemberRole"
                  placeholder="Ex: Presidente"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  disabled={saving}
                />
              </div>
              <Button onClick={handleAddMember} disabled={saving || !newMemberEmail || !newMemberRole}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CPACommissionManagement;
