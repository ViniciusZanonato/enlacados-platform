import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  flagged:        { label: 'Sinalizada',       color: 'bg-red-100 text-red-800',    icon: XCircle },
  pending_review: { label: 'Revisão Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved:       { label: 'Aprovada',         color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function ModerationQueue() {
  const [filterStatus, setFilterStatus] = useState('flagged');
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-moderation', filterStatus],
    queryFn: async () => {
      let q = supabase
        .from('communication_logs')
        .select('id, message, moderation_status, created_at, institution_profile_id, moderation_reason')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterStatus !== 'all') q = q.eq('moderation_status', filterStatus);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('communication_logs')
        .update({ moderation_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="flagged">Sinalizadas</SelectItem>
            <SelectItem value="pending_review">Revisão Pendente</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{logs.length} mensagens</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => {
                const config = STATUS_CONFIG[log.moderation_status as keyof typeof STATUS_CONFIG];
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{log.message}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.moderation_reason || '—'}
                    </TableCell>
                    <TableCell>
                      {config && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {log.moderation_status !== 'approved' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: log.id, status: 'approved' })}
                            disabled={updateStatus.isPending}
                          >
                            Aprovar
                          </Button>
                        )}
                        {log.moderation_status !== 'flagged' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatus.mutate({ id: log.id, status: 'flagged' })}
                            disabled={updateStatus.isPending}
                          >
                            Sinalizar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem neste status.
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
