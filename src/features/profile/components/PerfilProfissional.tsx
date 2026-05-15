import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, ProfessionalProfile } from "@/features/profile/hooks/useProfile"; // Import Profile and ProfessionalProfile

interface PerfilProfissionalProps {
  profile: Profile;
  onUpdate: () => void;
}

const PerfilProfissional = ({ profile, onUpdate }: PerfilProfissionalProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professionalData, setProfessionalData] = useState<ProfessionalProfile | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    bio: "",
    specialization: "",
    experience_years: 0,
    certifications: [] as string[],
    skills: [] as string[],
    portfolio_links: [] as string[],
    availability: "",
    social_media: {},
  });
  const [newCertification, setNewCertification] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newLink, setNewLink] = useState("");

  const loadProfessionalProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfessionalData(data);
        setFormData({
          title: data.title || "",
          bio: data.bio || "",
          specialization: data.specialization || "",
          experience_years: data.experience_years || 0,
          certifications: data.certifications || [],
          skills: data.skills || [],
          portfolio_links: data.portfolio_links || [],
          availability: data.availability || "",
          social_media: data.social_media || {},
        });
      }
    } catch (error: Error) {
      console.error("Error loading professional profile:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadProfessionalProfile();
    }
  }, [profile, loadProfessionalProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (professionalData) {
        const { error } = await supabase
          .from("professional_profiles")
          .update(formData)
          .eq("id", professionalData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("professional_profiles")
          .insert({ ...formData, profile_id: profile.id });

        if (error) throw error;
      }

      toast.success("Perfil profissional atualizado!");
      onUpdate();
    } catch (error: Error) {
      console.error("Error saving professional profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const addLink = () => {
    if (newLink.trim()) {
      setFormData({
        ...formData,
        portfolio_links: [...formData.portfolio_links, newLink.trim()],
      });
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      portfolio_links: formData.portfolio_links.filter((_, i) => i !== index),
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
        <h3 className="text-2xl font-bold mb-4 text-foreground">Perfil Profissional</h3>
        <p className="text-muted-foreground mb-6">
          Crie seu currículo digital exibindo experiências, formações e portfólio.
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
        <Label htmlFor="title">Título / Cargo</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Psicopedagoga, Professor de Matemática"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="pro-bio">Bio Profissional</Label>
        <Textarea
          id="pro-bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Descreva sua experiência e especialidades..."
          rows={4}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="specialization">Especialização</Label>
          <Input
            id="specialization"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            placeholder="Área de especialização"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="experience_years">Anos de Experiência</Label>
          <Input
            id="experience_years"
            type="number"
            value={formData.experience_years}
            onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="availability">Disponibilidade</Label>
        <Input
          id="availability"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          placeholder="Ex: Manhãs, Tardes, Noites"
          className="mt-2"
        />
      </div>

      <div>
        <Label>Redes Sociais</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Input
            value={formData.social_media?.linkedin || ""}
            onChange={(e) => setFormData({ ...formData, social_media: { ...formData.social_media, linkedin: e.target.value } })}
            placeholder="LinkedIn"
          />
          <Input
            value={formData.social_media?.instagram || ""}
            onChange={(e) => setFormData({ ...formData, social_media: { ...formData.social_media, instagram: e.target.value } })}
            placeholder="Instagram"
          />
        </div>
      </div>

      <div>
        <Label>Certificações</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            placeholder="Adicionar certificação"
            onKeyPress={(e) => e.key === "Enter" && addCertification()}
          />
          <Button type="button" onClick={addCertification} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.certifications.map((cert, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{cert}</span>
              <button
                onClick={() => removeCertification(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Habilidades</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Adicionar habilidade"
            onKeyPress={(e) => e.key === "Enter" && addSkill()}
          />
          <Button type="button" onClick={addSkill} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{skill}</span>
              <button
                onClick={() => removeSkill(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Links do Portfólio</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://..."
            onKeyPress={(e) => e.key === "Enter" && addLink()}
          />
          <Button type="button" onClick={addLink} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {formData.portfolio_links.map((link, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-2 rounded-lg flex items-center justify-between"
            >
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate flex-1"
              >
                {link}
              </a>
              <button
                onClick={() => removeLink(index)}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                <X className="w-4 h-4" />
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

export default PerfilProfissional;
