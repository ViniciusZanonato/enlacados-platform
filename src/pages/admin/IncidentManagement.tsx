import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentManagement() {
    const [isAdding, setIsAdding] = useState(false);
    const queryClient = useQueryClient();

    const { data: incidents, isLoading } = useQuery({
        queryKey: ['incidentLogs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('incident_logs')
                .select('*')
                .order('reported_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const createIncidentMutation = useMutation({
        mutationFn: async (newIncident: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user?.id).single();
            
            const { error } = await supabase
                .from('incident_logs')
                .insert([{ ...newIncident, reported_by: profile?.id }]);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Incidente registrado com sucesso.');
            queryClient.invalidateQueries({ queryKey: ['incidentLogs'] });
            setIsAdding(false);
        },
        onError: (error: any) => {
            toast.error(`Erro ao registrar: ${error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase
                .from('incident_logs')
                .update({ status, resolved_at: status === 'resolvido' ? new Date().toISOString() : null })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Status atualizado.');
            queryClient.invalidateQueries({ queryKey: ['incidentLogs'] });
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            impact_level: formData.get('impact_level'),
            status: 'aberto',
            metadata: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                stack: new Error().stack
            }
        };
        createIncidentMutation.mutate(data);
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-destructive h-8 w-8" />
                        Gestão de Incidentes (LGPD)
                    </h1>
                    <p className="text-muted-foreground">Protocolo oficial de resposta a vulnerabilidades e incidentes de segurança.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancelar' : <><Plus className="mr-2 h-4 w-4" /> Registrar Incidente</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle>Novo Registro de Incidente</CardTitle>
                        <CardDescription>Descreva detalhadamente o evento para fins de auditoria jurídica.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título do Evento</Label>
                                    <Input id="title" name="title" required placeholder="Ex: Suspeita de acesso não autorizado" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="impact_level">Nível de Impacto</Label>
                                    <Select name="impact_level" defaultValue="baixo">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="baixo">Baixo</SelectItem>
                                            <SelectItem value="medio">Médio</SelectItem>
                                            <SelectItem value="alto">Alto</SelectItem>
                                            <SelectItem value="critico">Crítico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição Detalhada e Ações Imediatas</Label>
                                <Textarea id="description" name="description" required rows={4} placeholder="O que aconteceu? Quais dados foram afetados? O que foi feito?" />
                            </div>
                            <Button type="submit" className="w-full" disabled={createIncidentMutation.isPending}>
                                {createIncidentMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirmar Registro Oficial'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6">
                {incidents?.map((incident: any) => (
                    <Card key={incident.id} className={incident.status === 'resolvido' ? 'opacity-70' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    {incident.status === 'aberto' ? <AlertTriangle className="text-yellow-500 h-5 w-5" /> : <CheckCircle className="text-green-500 h-5 w-5" />}
                                    {incident.title}
                                </CardTitle>
                                <CardDescription>
                                    Reportado em {format(new Date(incident.reported_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    incident.impact_level === 'critico' ? 'bg-red-600 text-white' : 
                                    incident.impact_level === 'alto' ? 'bg-red-100 text-red-600' : 
                                    incident.impact_level === 'medio' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    Impacto {incident.impact_level}
                                </span>
                                <Select 
                                    defaultValue={incident.status} 
                                    onValueChange={(val) => updateStatusMutation.mutate({ id: incident.id, status: val })}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aberto">Aberto</SelectItem>
                                        <SelectItem value="em_analise">Em Análise</SelectItem>
                                        <SelectItem value="resolvido">Resolvido</SelectItem>
                                        <SelectItem value="arquivado">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                                {incident.description}
                            </div>
                            
                            {incident.metadata && Object.keys(incident.metadata).length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Contexto Técnico (Reportado pela IA)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-[11px] font-mono bg-slate-900 text-slate-300 p-3 rounded overflow-x-auto">
                                        <div>
                                            <p className="text-slate-500 underline mb-1">URL de Origem</p>
                                            <p className="truncate">{incident.metadata.url || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 underline mb-1">Browser/System</p>
                                            <p className="truncate">{incident.metadata.userAgent || 'N/A'}</p>
                                        </div>
                                        {incident.metadata.stack && (
                                            <div className="col-span-2 border-t border-slate-800 mt-2 pt-2">
                                                <p className="text-slate-500 underline mb-1">Trace de Execução</p>
                                                <pre className="max-h-24 overflow-y-auto">{incident.metadata.stack}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {incident.resolved_at && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-semibold">
                                    <CheckCircle className="h-3 w-3" /> Resolvido em {format(new Date(incident.resolved_at), 'dd/MM/yyyy HH:mm')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex gap-4 items-start">
                <ShieldAlert className="text-primary h-6 w-6 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold text-primary">Nota de Segurança Jurídica</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Este painel é exclusivo para documentação de incidentes nos termos do Art. 48 da LGPD. 
                        Qualquer registro aqui efetuado possui valor probatório legal para defesa da instituição perante a ANPD (Autoridade Nacional de Proteção de Dados).
                        Mantenha os registros atualizados e anexe evidências técnicas se necessário.
                    </p>
                </div>
            </div>
        </div>
    );
}
