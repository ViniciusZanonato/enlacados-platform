import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, History } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogsTabProps {
    studentId: string;
}

export default function AuditLogsTab({ studentId }: AuditLogsTabProps) {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['auditLogs', studentId],
        queryFn: async () => {
            if (!studentId) return [];
            // Fetch logs related to this student's profile or related data
            // Since we can't easily join on generic record_id, we'll fetch logs for 'profiles' with this ID
            // And maybe 'academic_history' logs? Identifying academic history by ID is hard without knowing the IDs.
            // For now, let's show Profile changes. 
            // Ideally, the audit_logs table would have a 'related_user_id' column for easier filtering.

            // Fetch logs for this student in parallel to avoid complex OR syntax that fails with 400 error
            const [recordLogs, newDataLogs, oldDataLogs] = await Promise.all([
                supabase.from('audit_logs' as any).select('*').eq('record_id', studentId),
                supabase.from('audit_logs' as any).select('*').filter('new_data->student_profile_id' as any, 'eq', studentId),
                supabase.from('audit_logs' as any).select('*').filter('old_data->student_profile_id' as any, 'eq', studentId)
            ]);

            const combined = [
                ...(recordLogs.data || []),
                ...(newDataLogs.data || []),
                ...(oldDataLogs.data || [])
            ];

            // Filter unique by ID and sort by created_at desc
            const uniqueLogs = Array.from(new Map(combined.map(item => [item.id, item])).values())
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return uniqueLogs;
        },
        enabled: !!studentId
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <History className="h-5 w-5" /> Histórico de Alterações
                </h3>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Logs de Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Entidade</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                    <TableHead>Autor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs && logs.length > 0 ? (
                                    logs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap font-medium">
                                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>{log.table_name}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.operation === 'INSERT' ? 'bg-green-100 text-green-700' :
                                                    log.operation === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.operation}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                                {log.operation === 'UPDATE' ? (
                                                    <span>
                                                        Mudou de <pre className="inline">{JSON.stringify(log.old_data).substring(0, 20)}...</pre> para <pre className="inline">{JSON.stringify(log.new_data).substring(0, 20)}...</pre>
                                                    </span>
                                                ) : (
                                                    <span>{JSON.stringify(log.new_data || log.old_data).substring(0, 50)}...</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs">{log.changed_by}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum registro de alteração encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
