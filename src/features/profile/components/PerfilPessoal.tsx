import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, PersonalProfile } from "@/features/profile/hooks/useProfile"; // Import Profile and PersonalProfile

interface PerfilPessoalProps {
  profile: Profile;
  onUpdate: () => void;
}

const PerfilPessoal = ({ profile, onUpdate }: PerfilPessoalProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personalData, setPersonalData] = useState<PersonalProfile | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    current_school: "",
    education_level: "",
    interests: [] as string[],
    courses_completed: [] as string[],
    date_of_birth: "",
    location: "",
  });
  const [newInterest, setNewInterest] = useState("");
  const [newCourse, setNewCourse] = useState("");

  const loadPersonalProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("personal_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPersonalData(data);
        setFormData({
          bio: data.bio || "",
          current_school: data.current_school || "",
          education_level: data.education_level || "",
          interests: data.interests || [],
          courses_completed: data.courses_completed || [],
          date_of_birth: data.date_of_birth || "",
          location: data.location || "",
        });
      }
    } catch (error: Error) {
      console.error("Error loading personal profile:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadPersonalProfile();
    }
  }, [profile, loadPersonalProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (personalData) {
        const { error } = await supabase
          .from("personal_profiles")
          .update(formData)
          .eq("id", personalData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personal_profiles")
          .insert({ ...formData, profile_id: profile.id });

        if (error) throw error;
      }

      toast.success("Perfil atualizado com sucesso!");
      onUpdate();
    } catch (error: Error) {
      console.error("Error saving personal profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    });
  };

  const addCourse = () => {
    if (newCourse.trim()) {
      setFormData({
        ...formData,
        courses_completed: [...formData.courses_completed, newCourse.trim()],
      });
      setNewCourse("");
    }
  };

  const removeCourse = (index: number) => {
    setFormData({
      ...formData,
      courses_completed: formData.courses_completed.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4 text-foreground">Perfil Pessoal</h3>
        <p className="text-muted-foreground mb-6">
          Mostre onde você estuda, cursos realizados e informações básicas sobre sua jornada educacional.
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>
            <User className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar">Foto de Perfil</Label>
          <Input id="avatar" type="file" className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF até 10MB</p>
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Conte um pouco sobre você..."
          rows={4}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="date_of_birth">Data de Nascimento</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Cidade, Estado"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="current_school">Escola Atual</Label>
        <Input
          id="current_school"
          value={formData.current_school}
          onChange={(e) => setFormData({ ...formData, current_school: e.target.value })}
          placeholder="Nome da escola onde você estuda"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="education_level">Nível de Ensino</Label>
        <Input
          id="education_level"
          value={formData.education_level}
          onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
          placeholder="Ex: Ensino Médio, Fundamental, etc."
          className="mt-2"
        />
      </div>

      <div>
        <Label>Interesses</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Adicionar interesse"
            onKeyPress={(e) => e.key === "Enter" && addInterest()}
          />
          <Button type="button" onClick={addInterest} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.interests.map((interest, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{interest}</span>
              <button
                onClick={() => removeInterest(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Cursos Completados</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            placeholder="Adicionar curso"
            onKeyPress={(e) => e.key === "Enter" && addCourse()}
          />
          <Button type="button" onClick={addCourse} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.courses_completed.map((course, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{course}</span>
              <button
                onClick={() => removeCourse(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        variant="hero"
        size="lg"
        className="w-full"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar Perfil"
        )}
      </Button>
    </div>
  );
};

export default PerfilPessoal;
