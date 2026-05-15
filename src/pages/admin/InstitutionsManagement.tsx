import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Building2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function InstitutionsManagement() {
  const [search, setSearch] = useState('');

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ['admin-institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutional_profiles')
        .select(`
          id, institution_name, institution_type, contact_email,
          profile_id,
          profiles!inner(id, user_id, email, city, state, cnpj, plan, subscription_status)
        `)
        .order('institution_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.functions.invoke('switch-account', {
        body: { target_user_id: targetUserId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Iniciando Visualização Assistida...');
      window.location.href = '/portal/institutional';
    },
    onError: (err: any) => toast.error(`Erro ao acessar: ${err.message}`)
  });

  const filtered = institutions.filter(i =>
    !search ||
    i.institution_name?.toLowerCase().includes(search.toLowerCase()) ||
    (i.profiles as any)?.email?.toLowerCase().includes(search.toLowerCase()) ||
    (i.profiles as any)?.cnpj?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar instituição, e-mail ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} instituições</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instituição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cidade / Estado</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inst => (
                <TableRow key={inst.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{inst.institution_name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{inst.institution_type || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[(inst.profiles as any)?.city, (inst.profiles as any)?.state].filter(Boolean).join(' / ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{(inst.profiles as any)?.cnpj || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{(inst.profiles as any)?.plan ?? 'free'}</Badge></TableCell>
                  <TableCell>
                    <span className={`text-xs ${(inst.profiles as any)?.subscription_status === 'active' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      {(inst.profiles as any)?.subscription_status ?? 'free'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => impersonateMutation.mutate((inst.profiles as any).user_id)}
                      disabled={impersonateMutation.isPending}
                    >
                      {impersonateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Eye className="h-4 w-4 mr-2" /> Acessar Portal</>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma instituição encontrada.
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
