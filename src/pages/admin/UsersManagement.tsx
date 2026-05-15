import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const PROFILE_TYPE_LABELS: Record<string, string> = {
  personal: 'Aluno/Família',
  institutional: 'Instituição',
  professional: 'Profissional',
  admin: 'Admin',
};

const PROFILE_TYPE_COLORS: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800',
  institutional: 'bg-purple-100 text-purple-800',
  professional: 'bg-green-100 text-green-800',
  admin: 'bg-red-100 text-red-800',
};

export default function UsersManagement() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, profile_type, plan, subscription_status, terms_accepted_at, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || (Array.isArray(u.profile_type) && u.profile_type.includes(filterType));
    return matchSearch && matchType;
  });

  const handleChangeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_type: [newRole] })
      .eq('user_id', userId);
    if (error) { toast.error('Erro ao alterar perfil'); return; }
    toast.success('Perfil atualizado');
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    const { error } = await supabase.rpc('admin_delete_user', {
      target_user_id: userId
    });

    if (error) {
      toast.error('Erro ao excluir usuário: ' + error.message);
      return;
    }

    toast.success('Usuário excluído com sucesso');
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo de perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="personal">Aluno/Família</SelectItem>
            <SelectItem value="institutional">Instituição</SelectItem>
            <SelectItem value="professional">Profissional</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} usuários</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Termos aceitos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(user.profile_type) ? user.profile_type.map((type: string) => (
                        <span key={type} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PROFILE_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-800'}`}>
                          {PROFILE_TYPE_LABELS[type] ?? type}
                        </span>
                      )) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROFILE_TYPE_COLORS[user.profile_type] ?? 'bg-gray-100 text-gray-800'}`}>
                          {PROFILE_TYPE_LABELS[user.profile_type] ?? user.profile_type}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.plan ?? 'free'}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${user.subscription_status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {user.subscription_status ?? 'free'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.terms_accepted_at ? new Date(user.terms_accepted_at).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select onValueChange={(v) => handleChangeRole(user.user_id, v)}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue placeholder="Alterar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Aluno</SelectItem>
                          <SelectItem value="institutional">Instituição</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
