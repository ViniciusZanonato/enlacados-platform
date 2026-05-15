import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Trash2, CheckCircle, AlertTriangle, Loader2, Plus, Sun, Moon, Monitor } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';

export function SettingsPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();
    const [newWord, setNewWord] = useState('');

    // Fetch Settings
    const { data: settings, isLoading: isLoadingSettings } = useQuery<any>({
        queryKey: ['institutionalSettings', institutionalProfileId],
        queryFn: async () => {
            if (!institutionalProfileId) return null;
            const { data, error } = await supabase
                .from('institutional_settings' as any)
                .select('*')
                .eq('institution_profile_id', institutionalProfileId)
                .maybeSingle();

            if (!data && !error) {
                // Initialize if empty
                const { data: newData, error: createError } = await supabase
                    .from('institutional_settings' as any)
                    .insert({ institution_profile_id: institutionalProfileId, blocked_words: [] })
                    .select()
                    .single();
                if (createError) throw createError;
                return newData;
            }
            if (error) throw error;
            return data;
        },
        enabled: !!institutionalProfileId
    });

    // Fetch Flagged Logs
    const { data: flaggedLogs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['flaggedLogs', institutionalProfileId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('communication_logs' as any)
                .select('*')
                .eq('moderation_status', 'flagged')
                .eq('institution_profile_id', institutionalProfileId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        }
    });

    // Mutations
    const updateWordsMutation = useMutation({
        mutationFn: async (words: string[]) => {
            const { error } = await supabase
                .from('institutional_settings' as any)
                .update({ blocked_words: words })
                .eq('institution_profile_id', institutionalProfileId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutionalSettings'] });
            toast.success('Configurações atualizadas!');
        }
    });

    const releaseMessageMutation = useMutation({
        mutationFn: async (logId: string) => {
            const { data, error } = await supabase.rpc('release_flagged_message', { p_log_id: logId });
            if (error) throw error;
            // @ts-ignore
            if (data && data.success === false) throw new Error(data.error);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flaggedLogs'] });
            toast.success('Mensagem liberada com sucesso!');
        }
    });

    const handleAddWord = () => {
        if (!newWord.trim() || !settings) return;
        const current = settings.blocked_words || [];
        if (!current.includes(newWord.trim())) {
            updateWordsMutation.mutate([...current, newWord.trim()]);
        }
        setNewWord('');
    };

    const handleRemoveWord = (word: string) => {
        if (!settings) return;
        const current = settings.blocked_words || [];
        updateWordsMutation.mutate(current.filter((w: string) => w !== word));
    };

    const [enrollmentStart, setEnrollmentStart] = useState('');
    const [enrollmentEnd, setEnrollmentEnd] = useState('');

    // Update local state when settings load
    React.useEffect(() => {
        if (settings) {
            setEnrollmentStart(settings.enrollment_start_date ? format(new Date(settings.enrollment_start_date), "yyyy-MM-dd'T'HH:mm") : '');
            setEnrollmentEnd(settings.enrollment_end_date ? format(new Date(settings.enrollment_end_date), "yyyy-MM-dd'T'HH:mm") : '');
        }
    }, [settings]);

    const updateEnrollmentMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('institutional_settings' as any)
                .update({
                    enrollment_start_date: enrollmentStart || null,
                    enrollment_end_date: enrollmentEnd || null
                })
                .eq('institution_profile_id', institutionalProfileId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutionalSettings'] });
            toast.success('Período de matrícula atualizado!');
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Configurações</h2>
                    <p className="text-muted-foreground">Gerencie o perfil e ferramentas da instituição.</p>
                </div>
            </div>

            <Tabs defaultValue="moderation" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="moderation">Moderação & IA</TabsTrigger>
                    <TabsTrigger value="notifications">Notificações</TabsTrigger>
                </TabsList>

                <TabsContent value="moderation" className="space-y-6 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Config Blocked Words */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Palavras Bloqueadas
                                </CardTitle>
                                <CardDescription>
                                    Termos que serão automaticamente filtrados e retidos pela IA.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Adicionar nova palavra..."
                                        value={newWord}
                                        onChange={(e) => setNewWord(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                                    />
                                    <Button onClick={handleAddWord} size="icon"><Plus className="h-4 w-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {isLoadingSettings ? (
                                        <Loader2 className="animate-spin" />
                                    ) : settings?.blocked_words?.length > 0 ? (
                                        settings.blocked_words.map((word: string) => (
                                            <Badge key={word} variant="secondary" className="px-2 py-1">
                                                {word}
                                                <Trash2
                                                    className="h-3 w-3 ml-2 cursor-pointer text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveWord(word)}
                                                />
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Nenhuma palavra configurada.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Queue */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Fila de Moderação
                                </CardTitle>
                                <CardDescription>
                                    Mensagens retidas aguardando análise manual.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                    {isLoadingLogs ? (
                                        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                    ) : flaggedLogs?.length > 0 ? (
                                        flaggedLogs.map((log: any) => (
                                            <div key={log.id} className="p-4 border rounded-lg bg-background space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className="border-amber-500 text-amber-500">
                                                        Retida
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(log.created_at), 'dd/MM HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed bg-muted/50 p-2 rounded">
                                                    "{log.message}"
                                                </p>
                                                <p className="text-xs text-red-500">
                                                    Motivo: {log.moderation_reason}
                                                </p>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toast.info('Funcionalidade de rejeitar (apagar) ainda não implementada')}
                                                    >
                                                        Rejeitar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => releaseMessageMutation.mutate(log.id)}
                                                        disabled={releaseMessageMutation.isPending}
                                                    >
                                                        {releaseMessageMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                        Liberar Mensagem
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>Nenhuma mensagem retida.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="general" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>Customize a aparência do sistema.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tema do Sistema</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={theme === 'light' ? 'default' : 'outline'}
                                        onClick={() => setTheme('light')}
                                        className="gap-2"
                                    >
                                        <Sun className="h-4 w-4" /> Claro
                                    </Button>
                                    <Button
                                        variant={theme === 'dark' ? 'default' : 'outline'}
                                        onClick={() => setTheme('dark')}
                                        className="gap-2"
                                    >
                                        <Moon className="h-4 w-4" /> Escuro
                                    </Button>
                                    <Button
                                        variant={theme === 'system' ? 'default' : 'outline'}
                                        onClick={() => setTheme('system')}
                                        className="gap-2"
                                    >
                                        <Monitor className="h-4 w-4" /> Sistema
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Período de Rematrícula</CardTitle>
                            <CardDescription>Defina quando os alunos podem solicitar rematrícula.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Início</Label>
                                    <Input
                                        type="datetime-local"
                                        value={enrollmentStart}
                                        onChange={(e) => setEnrollmentStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fim</Label>
                                    <Input
                                        type="datetime-local"
                                        value={enrollmentEnd}
                                        onChange={(e) => setEnrollmentEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={() => updateEnrollmentMutation.mutate()}
                                disabled={updateEnrollmentMutation.isPending}
                            >
                                {updateEnrollmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Datas
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Instituição</CardTitle>
                            <CardDescription>Detalhes públicos da sua instituição.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Nome da Instituição</Label>
                                <Input disabled placeholder="Nome da Instituição (Gerenciado pelo Admin)" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
