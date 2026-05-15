import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X, Building } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, InstitutionalProfile } from "@/features/profile/hooks/useProfile"; // Import Profile and InstitutionalProfile

interface PerfilInstitucionalProps {
  profile: Profile;
  onUpdate: () => void;
}

const PerfilInstitucional = ({ profile, onUpdate }: PerfilInstitucionalProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutionalData, setInstitutionalData] = useState<InstitutionalProfile | null>(null);
  const [formData, setFormData] = useState({
    institution_name: "",
    institution_type: "",
    description: "",
    address: "",
    phone: "",
    website: "",
    activities: [] as string[],
    social_media: {},
    gallery: [] as string[],
  });
  const [newActivity, setNewActivity] = useState("");

  const loadInstitutionalProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("institutional_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setInstitutionalData(data);
        setFormData({
          institution_name: data.institution_name || "",
          institution_type: data.institution_type || "",
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          website: data.website || "",
          activities: data.activities || [],
          social_media: data.social_media || {},
          gallery: data.gallery || [],
        });
      }
    } catch (error: Error) {
      console.error("Error loading institutional profile:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadInstitutionalProfile();
    }
  }, [profile, loadInstitutionalProfile]);

  const handleSave = async () => {
    if (!formData.institution_name.trim()) {
      toast.error("Nome da instituição é obrigatório!");
      return;
    }

    setSaving(true);
    try {
      if (institutionalData) {
        const { error } = await supabase
          .from("institutional_profiles")
          .update(formData)
          .eq("id", institutionalData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("institutional_profiles")
          .insert({ ...formData, profile_id: profile.id });

        if (error) throw error;
      }

      toast.success("Perfil institucional atualizado!");
      onUpdate();
    } catch (error: Error) {
      console.error("Error saving institutional profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setFormData({
        ...formData,
        activities: [...formData.activities, newActivity.trim()],
      });
      setNewActivity("");
    }
  };

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
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
        <h3 className="text-2xl font-bold mb-4 text-foreground">Perfil Institucional</h3>
        <p className="text-muted-foreground mb-6">
          Crie uma vitrine pública da sua instituição com informações, atividades e contatos.
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile?.logo_url} />
          <AvatarFallback>
            <Building className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="logo">Logo da Instituição</Label>
          <Input id="logo" type="file" className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF até 10MB</p>
        </div>
      </div>

      <div>
        <Label htmlFor="institution_name">Nome da Instituição *</Label>
        <Input
          id="institution_name"
          value={formData.institution_name}
          onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
          placeholder="Nome da sua escola ou instituição"
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="institution_type">Tipo de Instituição</Label>
        <Input
          id="institution_type"
          value={formData.institution_type}
          onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
          placeholder="Ex: Escola, Universidade, Cursinho"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="inst-description">Descrição</Label>
        <Textarea
          id="inst-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva sua instituição, missão e diferenciais..."
          rows={4}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Rua, número, bairro, cidade - UF"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://..."
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
        <Label>Atividades e Serviços</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Input
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Adicionar atividade"
            onKeyPress={(e) => e.key === "Enter" && addActivity()}
          />
          <Button type="button" onClick={addActivity} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.activities.map((activity, index) => (
            <div
              key={index}
              className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{activity}</span>
              <button
                onClick={() => removeActivity(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Galeria de Imagens</Label>
        <div className="mt-2">
          <Input id="gallery" type="file" multiple />
          <p className="text-xs text-muted-foreground mt-1">Adicione até 5 imagens (PNG, JPG)</p>
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

export default PerfilInstitucional;
