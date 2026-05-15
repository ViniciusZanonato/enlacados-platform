import { supabase } from "@/api/supabase/client";
import { toast } from "sonner";

interface InstitutionalProfile {
  id: string;
  institution_name: string;
  profile_id: string;
  profiles: {
    profile_type: string;
  };
}

export const fetchInstitutions = async () => {
  // Fetch institutions sorted by their profile's XP.
  // Using left join (profiles instead of profiles!inner) to ensure we get institutions even if profile data is incomplete.
  const { data, error } = await supabase
    .from('institutional_profiles')
    .select('id, institution_name, profile_id, profiles(profile_type, xp)')
    .order('created_at', { ascending: false })
    .limit(20); // Fetch a batch to sort in JS

  if (error) {
    if (error.code !== 'PGRST303') {
      console.error("Error fetching institutions:", error);
      toast.error("Erro ao carregar instituições.");
    }
    return [];
  }

  // Sort manually by xp desc
  const sortedData = (data || []).sort((a: any, b: any) => {
    const xpA = a.profiles?.xp || 0;
    const xpB = b.profiles?.xp || 0;
    return xpB - xpA;
  });

  // Take top 4
  return sortedData.slice(0, 4).map((inst: any) => ({
    id: inst.profile_id,
    name: inst.institution_name,
    type: "Ensino Superior"
  }));
};

export const fetchCourses = async () => {
  // Fetch courses and their institution's XP
  // We fetch a larger batch and sort in JS because deep nested ordering can be tricky
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, 
      name, 
      institutional_profile_id, 
      institutional_profiles (
        institution_name, 
        profile_id,
        profiles (
          xp
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50); // Fetch top 50 to sort

  if (error) {
    if (error.code !== 'PGRST303') {
      console.error("Error fetching courses:", error);
      toast.error("Erro ao carregar cursos.");
    }
    throw error;
  }

  // Sort by institution XP descending
  const sortedCourses = (data || []).sort((a: any, b: any) => {
    const xpA = a.institutional_profiles?.profiles?.xp || 0;
    const xpB = b.institutional_profiles?.profiles?.xp || 0;
    return xpB - xpA;
  });

  // Take top 4
  return sortedCourses.slice(0, 4).map((c: any) => ({
    id: c.id,
    name: c.name,
    institution: c.institutional_profiles?.institution_name || 'Instituição desconhecida',
    institutionalProfileId: c.institutional_profiles?.profile_id
  }));
};

export const fetchProfessionals = async (userSpecialties?: string[]) => {
  let query = supabase
    .from('professional_profiles')
    .select('id, profile_id, title, profiles(full_name)');

  if (userSpecialties && userSpecialties.length > 0) {
    query = query.in('title', userSpecialties);
  }

  const { data, error } = await query.limit(4);
  if (error) {
    if (error.code !== 'PGRST303') { // Ignore JWT expired errors during initial load
      console.error("Error fetching professionals:", error);
      toast.error("Erro ao carregar profissionais.");
    }
    throw error;
  }
  return data.map(p => ({ id: p.profile_id, name: p.profiles.full_name, specialty: p.title }));
};