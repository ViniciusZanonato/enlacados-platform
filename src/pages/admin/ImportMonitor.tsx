import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ImportMonitor() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-import-logs'],
    queryFn: async () => {
      // Assuming audit_logs has entity_type = 'import' or table_name starts with smart_import
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or('entity_type.eq.import,route.ilike.%import%')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ?? [];
    }
  });

  const filtered = logs.filter(log => 
    !search || 
    log.metadata?.institution_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.action_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Monitor de Importações (Jobs)</h2>
        <p className="text-muted-foreground">Acompanhe o processamento de planilhas e cargas de dados.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por instituição ou tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Tipo de Carga</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.metadata?.institution_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      {log.action_type || 'Importação'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.metadata?.count || '—'} linhas
                  </TableCell>
                  <TableCell>
                    {log.metadata?.error ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Falha
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Sucesso
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-xs text-primary hover:underline" onClick={() => console.log(log.metadata)}>
                      Ver Detalhes
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum job de importação encontrado.
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
