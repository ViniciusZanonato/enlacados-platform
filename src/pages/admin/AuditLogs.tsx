import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, ShieldAlert } from 'lucide-react';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, operation, table_name, record_id, changed_by, old_data, new_data, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const actions = [...new Set(logs.map((l: any) => l.operation).filter(Boolean))];

  const filtered = logs.filter((log: any) => {
    const matchSearch = !search ||
      log.operation?.includes(search) ||
      log.table_name?.includes(search) ||
      log.changed_by?.includes(search) ||
      log.record_id?.includes(search);
    const matchAction = filterAction === 'all' || log.operation === filterAction;
    return matchSearch && matchAction;
  });

  const OPERATION_COLORS: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, tabela, user ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} registros</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${OPERATION_COLORS[log.operation] ?? 'bg-gray-100 text-gray-800'}`}>
                      {log.operation}
                    </span>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{log.table_name}</code></TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{log.record_id?.slice(0, 12) ?? '—'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{log.changed_by?.slice(0, 12) ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado.
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
