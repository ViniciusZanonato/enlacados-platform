import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface BlogPostEditorProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    status: string;
    cover_image_url?: string;
  };
  onSave: (data: { id?: string; title: string; content: string; status: string; cover_image_url?: string }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const BlogPostEditor = ({ initialData, onSave, onCancel, saving }: BlogPostEditorProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setStatus(initialData.status);
      setCoverImageUrl(initialData.cover_image_url || '');
    } else {
      setTitle('');
      setContent('');
      setStatus('draft');
    }
  }, [initialData]);

  const handleSubmit = async () => {
    await onSave({ id: initialData?.id, title, content, status, cover_image_url: coverImageUrl });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="coverImageUrl">URL da Imagem de Capa</Label>
        <Input id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
      </div>
      <div>
        <Label htmlFor="content">Conteúdo</Label>
        <ReactQuill theme="snow" value={content} onChange={setContent} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
          ) : (
            'Salvar Post'
          )}
        </Button>
      </div>
    </div>
  );
};

export default BlogPostEditor;
