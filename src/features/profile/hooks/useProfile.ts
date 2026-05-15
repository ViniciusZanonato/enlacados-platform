import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Define interfaces for the data types
interface AccessibilitySettings {
    theme: string;
    fontSize: number;
}

interface Profile {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string;
    banner_url: string;
    plan: string;
    cpf?: string;
    profile_type: string[];
    is_private: boolean;
    accessibility_settings: AccessibilitySettings; // JSONB
    personal_profiles: PersonalProfile | null;
    professional_profiles: ProfessionalProfile | null;
    institutional_profiles: InstitutionalProfile | null;
    institutional_courses: InstitutionalCourse[];
    personal_courses: PersonalCourse[];
    awards: Award[];
}

interface PersonalProfile {
    id: string;
    profile_id: string;
    bio: string;
    created_at?: string;
    updated_at?: string;
}

interface ProfessionalProfile {
    id: string;
    profile_id: string;
    bio: string;
    title: string;
    profession?: string;
    other_profession?: string;
    created_at?: string;
    updated_at?: string;
    linking_code?: string;
    portfolio?: any;
    work_experience?: any;
    education?: any;
    specialization?: string;
    experience_years?: number;
    skills?: string[];
    certifications?: string[];
}

interface InstitutionalProfile {
    id: string;
    profile_id: string;
    description: string;
    institution_name: string;
    created_at?: string;
    updated_at?: string;
    linking_code?: string;
}

interface InstitutionalCourse {
    id: string;
    institutional_profile_id: string;
    name: string;
    category: string;
    landing_page_url: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

interface PersonalCourse {
    id: string;
    profile_id: string;
    course_name: string;
    institution: string;
    completion_date: string;
    description: string;
    certificate_url?: string;
    created_at?: string;
    updated_at?: string;
}

interface Award {
    id: string;
    profile_id: string;
    award_name: string;
    issuer: string;
    issue_date: string;
    description: string;
    certificate_url?: string;
    created_at?: string;
    updated_at?: string;
}

import { recordProfileView } from "@/lib/supabase-utils";



import { handleSupabaseError } from "@/lib/supabase-error-handler";

export const useProfile = (profileId: string) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // Renamed for clarity and consistency
    const [profile, setProfile] = useState<Profile | null>(null);
    const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
    const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
    const [institutionalProfile, setInstitutionalProfile] = useState<InstitutionalProfile | null>(null);
    const [institutionalCourses, setInstitutionalCourses] = useState<InstitutionalCourse[]>([]);
    const [personalCourses, setPersonalCourses] = useState<PersonalCourse[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const queryClient = useQueryClient();

    const updateProfessionalProfile = (field, value) => {
        setProfessionalProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateNestedState = (setter, path, value) => {
        setter(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current = newState;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newState;
        });
    };

    const handleProfileChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Generic type alias for better readability locally
    type ProfileWithDetails = Profile & {
        personal_profiles: PersonalProfile | null;
        professional_profiles: ProfessionalProfile | null;
        institutional_profiles: InstitutionalProfile | null;
        awards: Award[];
        personal_courses: PersonalCourse[];
    };

    const loadProfileData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch main profile data with nested relations
            const { data: rawProfile, error: mainProfileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    personal_profiles(*),
                    professional_profiles(*, linking_code),
                    institutional_profiles(*, linking_code),
                    awards(*),
                    personal_courses(*)
                `)
                .eq('id', profileId)
                .maybeSingle();

            if (mainProfileError) throw mainProfileError;
            
            if (!rawProfile) {
                setProfile(null);
                setLoading(false);
                return;
            }

            const mainProfile = rawProfile as ProfileWithDetails;

            // Record the view
            await recordProfileView(mainProfile.id, null); // viewer_id is null for now


            // Institutional Profile Fetching
            let fetchedInstitutionalProfile = null;
            let fetchedInstitutionalCourses = [];

            if (mainProfile.profile_type?.includes('institutional')) {
                // Already fetched via main query join as institutional_profiles
                fetchedInstitutionalProfile = mainProfile.institutional_profiles;

                // If we need to fetch courses for it:
                if (fetchedInstitutionalProfile?.id) {
                    const { data: coursesData, error: coursesError } = await supabase
                        .from('courses')
                        .select('*')
                        .eq('institutional_profile_id', fetchedInstitutionalProfile.id);

                    if (coursesError) throw coursesError;
                    fetchedInstitutionalCourses = coursesData || [];
                }
            }


            setProfile(mainProfile);
            setPersonalProfile(mainProfile.personal_profiles || null);
            setProfessionalProfile(mainProfile.professional_profiles || null);
            setInstitutionalProfile(fetchedInstitutionalProfile || null);
            setInstitutionalCourses(fetchedInstitutionalCourses || []);
            setAwards(mainProfile.awards || []);
            setPersonalCourses(mainProfile.personal_courses || []);



        } catch (error: any) {

            handleSupabaseError(error, "Não foi possível carregar o perfil.");

        } finally {

            setLoading(false);

        }

    }, [profileId]);



    const handleSave = async () => {
        setIsSaving(true);
        try {
            // ... (toda a lógica de salvar dados que já existe)

            // 1. Save main profile data
            // 1. Save main profile data
            const { error: profileError } = await (supabase
                .from("profiles") as any)
                .update({
                    full_name: profile.full_name,
                    cpf: profile.cpf,
                    avatar_url: profile.avatar_url,
                    banner_url: profile.banner_url,
                    plan: profile.plan,
                    is_private: profile.is_private,
                    accessibility_settings: profile.accessibility_settings
                })
                .eq("id", profile.id);
            if (profileError) throw profileError;

            // 2. Save specific profile data based on roles
            if (profile.profile_type?.includes("personal")) {
                const { id, profile_id, created_at, updated_at, ...updateData } = personalProfile;
                if (id) {
                    const { error } = await (supabase.from("personal_profiles") as any).update(updateData).eq("id", id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('personal_profiles').insert({ ...updateData, profile_id: profile.id } as any);
                    if (error) throw error;
                }
            }
            
            if (profile.profile_type?.includes("professional")) {
                // Explicitly update the professional profile to ensure array changes are saved
                const { error } = await (supabase.from("professional_profiles") as any)
                    .update({
                        bio: professionalProfile.bio,
                        title: professionalProfile.title,
                        profession: professionalProfile.profession,
                        specialization: professionalProfile.specialization,
                        experience_years: professionalProfile.experience_years,
                        skills: professionalProfile.skills,
                        certifications: professionalProfile.certifications,
                        portfolio: professionalProfile.portfolio,
                        work_experience: professionalProfile.work_experience,
                        education: professionalProfile.education
                    })
                    .eq('profile_id', profile.id);

                if (error) throw error;
            }
            
            if (profile.profile_type?.includes("institutional")) {
                const { id, profile_id, created_at, updated_at, ...updateData } = institutionalProfile;
                if (id) {
                    const { error } = await (supabase.from("institutional_profiles") as any).update(updateData).eq("id", id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('institutional_profiles').insert({ ...updateData, profile_id: profile.id, institution_name: profile.full_name } as any);
                    if (error) throw error;
                }
            }


            // 3. Sync personal courses and awards (delete and recreate strategy)
            await supabase.from('personal_courses').delete().eq('profile_id', profile.id);
            if (personalCourses && personalCourses.length > 0) {
                const coursesToInsert = personalCourses.map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, profile_id: profile.id }));
                const { error: coursesError } = await supabase.from('personal_courses').insert(coursesToInsert as any);
                if (coursesError) throw coursesError;
            }

            await supabase.from('awards').delete().eq('profile_id', profile.id);
            if (awards && awards.length > 0) {
                const awardsToInsert = awards.map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, profile_id: profile.id }));
                const { error: awardsError } = await supabase.from('awards').insert(awardsToInsert as any);
                if (awardsError) throw awardsError;
            }

            // 4. Sync institutional courses (delete and recreate strategy)
            if (profile.profile_type?.includes('institutional') && institutionalProfile?.id) {

                const { error: deleteError } = await supabase.from('courses').delete().eq('institutional_profile_id', institutionalProfile.id);
                if (deleteError) {
                    console.error("Error deleting existing institutional courses:", deleteError);
                    toast.error(`Erro ao deletar cursos existentes: ${deleteError.message}`);
                    throw deleteError; // Re-throw to stop save process
                }

                if (institutionalCourses && institutionalCourses.length > 0) {
                    const coursesToInsert = institutionalCourses.map(c => ({
                        institutional_profile_id: institutionalProfile.id,
                        name: c.name,
                        category: c.category,
                        landing_page_url: c.landing_page_url,
                        description: c.description
                    }));
                    const { error: coursesError } = await supabase.from('courses').insert(coursesToInsert as any);
                    if (coursesError) throw coursesError;
                }
            }

            toast.success("Perfil salvo com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['profile', profileId] }); // Invalidate profile query
            queryClient.invalidateQueries({ queryKey: ['institutionalCourses'] }); // Invalidate institutional courses query
            await loadProfileData(); // Re-fetch data
            return true;
        } catch (error: any) {
            if (error?.code === '23505') {
                toast.error("O CPF informado já está em uso por outro usuário.");
            } else {
                toast.error(`Erro ao salvar: ${error.message}`);
            }
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (profileId) {
            loadProfileData();
        }
    }, [profileId, loadProfileData]);

    return {
        loading,
        isSaving, // Export isSaving
        profile,
        personalProfile,
        professionalProfile,
        institutionalProfile,
        institutionalCourses,
        personalCourses,
        awards,
        setProfile,
        setPersonalProfile,
        setProfessionalProfile,
        setInstitutionalProfile,
        setInstitutionalCourses,
        setPersonalCourses,
        setAwards,
        updateProfessionalProfile,
        loadProfileData,
        handleSave
    };
};