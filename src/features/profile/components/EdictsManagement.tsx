import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns'; // Import a theme

interface Edict {
  id: string;
  institutional_profile_id: string;
  title: string;
  content: string;
  created_at: string;
}

const EdictsManagement = ({ institutionalProfileId }) => {
  const [edicts, setEdicts] = useState<Edict[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEdict, setEditingEdict] = useState<Edict | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEdicts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('edicts')
        .select('*')
        .eq('institutional_profile_id', institutionalProfileId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, "Erro ao carregar editais.");
        return;
      }

      setEdicts(data || []);
    } finally {
      setLoading(false);
    }
  }, [institutionalProfileId]);

  useEffect(() => {
    if (institutionalProfileId) {
      fetchEdicts();
    }
  }, [institutionalProfileId, fetchEdicts]);

  const handleSaveEdict = async (edictData) => {
    setSaving(true);
    try {
      const dataToSave = {
        ...edictData,
        institutional_profile_id: institutionalProfileId,
      };

      if (editingEdict) {
        const { error } = await supabase.from('edicts').update(dataToSave).eq('id', editingEdict.id);
        if (error) throw error;
        toast.success("Edital atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('edicts').insert(dataToSave);
        if (error) throw error;
        toast.success("Edital criado com sucesso!");
      }

      await fetchEdicts();
      setIsModalOpen(false);
      setEditingEdict(null);
    } catch (error: Error) {
      handleSupabaseError(error, "Erro ao salvar edital.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEdict = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este edital?")) return;

    try {
      const { error } = await supabase.from('edicts').delete().eq('id', id);
      if (error) throw error;

      toast.success("Edital excluído com sucesso!");
      await fetchEdicts();
    } catch (error: Error) {
      handleSupabaseError(error, "Erro ao excluir edital.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Editais</h3>
        <Button onClick={() => {
          setEditingEdict(null);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Edital
        </Button>
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      ) : edicts.length === 0 ? (
        <p>Nenhum edital encontrado.</p>
      ) : (
        <div className="space-y-4">
          {edicts.map((edict) => (
            <Card key={edict.id}>
              <CardHeader>
                <CardTitle>{edict.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => {
                    setEditingEdict(edict);
                    setIsModalOpen(true);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteEdict(edict.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>{edict.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EdictEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEdict(null);
        }}
        onSave={handleSaveEdict}
        edict={editingEdict}
        saving={saving}
      />
    </div>
  );
};

const EdictEditorModal = ({ isOpen, onClose, onSave, edict, saving }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState("Aberto");
  const [externalLink, setExternalLink] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (edict) {
      setTitle(edict.title || "");
      setContent(edict.content || "");
      setTargetAudience(edict.target_audience || "");
      setDeadline(edict.application_deadline ? new Date(edict.application_deadline) : undefined);
      setStatus(edict.status || "Aberto");
      setExternalLink(edict.external_link || "");
      setCategory(edict.category || "");
    } else {
      setTitle("");
      setContent("");
      setTargetAudience("");
      setDeadline(undefined);
      setStatus("Aberto");
      setExternalLink("");
      setCategory("");
    }
  }, [edict]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center bg-black bg-opacity-50`}>
      <div className="bg-card p-8 rounded-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">{edict ? "Editar Edital" : "Adicionar Edital"}</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Vestibular, Bolsa de Estudos..."/>
            </div>
            <div>
              <Label htmlFor="target_audience">Público-alvo</Label>
              <Input id="target_audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ex: Alunos de Graduação"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data Limite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Encerrado">Encerrado</SelectItem>
                  <SelectItem value="Em breve">Em breve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="external_link">Link Externo</Label>
            <Input id="external_link" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..."/>
          </div>

          <div>
            <Label htmlFor="content">Conteúdo</Label>
            <ReactQuill theme="snow" value={content} onChange={setContent} />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ title, content, target_audience: targetAudience, application_deadline: deadline, status, external_link: externalLink, category })} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EdictsManagement;
