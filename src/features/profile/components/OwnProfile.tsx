import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Briefcase, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PersonalProfile {
  bio: string;
  courses_completed: string[];
  interests: string[];
}

interface ProfessionalProfile {
  bio: string;
  skills: string[];
}

interface InstitutionalProfile {
  description: string;
  activities: string[];
}

interface Profile {
  profile_type: string[];
  full_name: string;
  email: string;
  avatar_url: string;
  personal_profiles: PersonalProfile[];
  professional_profiles: ProfessionalProfile[];
  institutional_profiles: InstitutionalProfile[];
}

const OwnProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "*, personal_profiles(*), professional_profiles(*), institutional_profiles(*)"
        )
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: Error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <p>Perfil não encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <img
          src="https://www.amf.edu.br/images/recanto-maestro/recanto-maestro-topo.jpg"
          alt="Banner"
          className="w-full h-64 object-cover rounded-t-3xl"
        />
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <Avatar className="w-32 h-32 border-4 border-white">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              {profile.profile_type?.includes("personal") && (
                <User className="w-16 h-16" />
              )}
              {profile.profile_type?.includes("professional") && (
                <Briefcase className="w-16 h-16" />
              )}
              {profile.profile_type?.includes("institutional") && (
                <Building2 className="w-16 h-16" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="bg-card rounded-b-3xl p-8 pt-24 text-center shadow-elegant border border-border">
        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
        <p className="text-muted-foreground">{profile.email}</p>

        <Tabs defaultValue="about" className="mt-8">
          <TabsList>
            <TabsTrigger value="about">Sobre</TabsTrigger>
            {profile.profile_type?.includes("personal") && (
              <>
                <TabsTrigger value="courses">Cursos</TabsTrigger>
                <TabsTrigger value="interests">Interesses</TabsTrigger>
              </>
            )}
            {profile.profile_type?.includes("professional") && (
              <>
                <TabsTrigger value="experience">Experiência</TabsTrigger>
                <TabsTrigger value="skills">Habilidades</TabsTrigger>
              </>
            )}
            {profile.profile_type?.includes("institutional") && (
              <>
                <TabsTrigger value="activities">Atividades</TabsTrigger>
                <TabsTrigger value="gallery">Galeria</TabsTrigger>
              </>
            )}
          </TabsList>
          <TabsContent value="about" className="mt-4 text-left">
            {profile.profile_type?.includes("personal") && (
              <p>{profile.personal_profiles[0]?.bio}</p>
            )}
            {profile.profile_type?.includes("professional") && (
              <p>{profile.professional_profiles[0]?.bio}</p>
            )}
            {profile.profile_type?.includes("institutional") && (
              <p>{profile.institutional_profiles[0]?.description}</p>
            )}
          </TabsContent>
          <TabsContent value="courses" className="mt-4 text-left">
            <ul className="space-y-2">
              {profile.personal_profiles[0]?.courses_completed?.map(
                (course: string, index: number) => (
                  <li key={index}>{course}</li>
                )
              )}
            </ul>
          </TabsContent>
          <TabsContent value="interests" className="mt-4 text-left">
            <div className="flex flex-wrap gap-2">
              {profile.personal_profiles[0]?.interests?.map(
                (interest: string, index: number) => (
                  <div
                    key={index}
                    className="bg-secondary px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </div>
                )
              )}
            </div>
          </TabsContent>
          <TabsContent value="experience" className="mt-4 text-left">
            {/* Add experience content here */}
          </TabsContent>
          <TabsContent value="skills" className="mt-4 text-left">
            <div className="flex flex-wrap gap-2">
              {profile.professional_profiles[0]?.skills?.map(
                (skill: string, index: number) => (
                  <div
                    key={index}
                    className="bg-secondary px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </div>
                )
              )}
            </div>
          </TabsContent>
          <TabsContent value="activities" className="mt-4 text-left">
            <ul className="space-y-2">
              {profile.institutional_profiles[0]?.activities?.map(
                (activity: string, index: number) => (
                  <li key={index}>{activity}</li>
                )
              )}
            </ul>
          </TabsContent>
          <TabsContent value="gallery" className="mt-4 text-left">
            {/* Add gallery content here */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OwnProfile;
