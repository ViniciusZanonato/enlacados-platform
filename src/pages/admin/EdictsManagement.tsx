import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Edit, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function EdictsManagement() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('aberto');
  const [targetAudience, setTargetAudience] = useState('');

  const { data: edicts, isLoading } = useQuery({
    queryKey: ['admin-edicts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edicts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase.from('edicts').update(payload.data).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('edicts').insert([payload.data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-edicts'] });
      toast.success('Edital salvo com sucesso!');
      resetForm();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('edicts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-edicts'] });
      toast.success('Edital removido!');
    }
  });

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('');
    setStatus('aberto');
    setTargetAudience('');
  };

  const handleEdit = (edict: any) => {
    setIsEditing(true);
    setEditingId(edict.id);
    setTitle(edict.title);
    setContent(edict.content);
    setCategory(edict.category || '');
    setStatus(edict.status || 'aberto');
    setTargetAudience(edict.target_audience || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingId,
      data: {
        title,
        content,
        category,
        status,
        target_audience: targetAudience
      }
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Editais</h2>
          <p className="text-muted-foreground">Crie, edite ou remova editais públicos.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Edital
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Edital' : 'Novo Edital'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Input value={status} onChange={e => setStatus(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Público Alvo</label>
                  <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo (HTML aceito)</label>
                <textarea 
                  className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Edital'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Editais Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>
            ) : edicts?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum edital cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edicts?.map(edict => (
                    <TableRow key={edict.id}>
                      <TableCell className="font-medium">{edict.title}</TableCell>
                      <TableCell>{edict.category}</TableCell>
                      <TableCell>{edict.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(edict)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                          if (confirm('Tem certeza?')) deleteMutation.mutate(edict.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
