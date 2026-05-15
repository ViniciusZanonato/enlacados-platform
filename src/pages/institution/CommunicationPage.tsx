import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MassCommunicationModal } from '@/components/MassCommunicationModal';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { format } from 'date-fns';

export function CommunicationPage() {
    const { institutionalProfileId } = useOutletContext<{ institutionalProfileId: string | null }>();
    const [isMassCommOpen, setIsMassCommOpen] = useState(false);

    const { data: logs, isLoading } = useQuery({
        queryKey: ['communicationLogs', institutionalProfileId],
        queryFn: async () => {
            // In a real app we might filter by institution_profile_id if the RPC supports it or if we link logs to institutions.
            // Currently logs are by sender_id (auth.uid). Staff should see their own sent messages.
            const { data, error } = await supabase
                .from('communication_logs' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        }
    });

    const totalSent = logs?.reduce((acc: number, log: any) => acc + (log.recipient_count || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Comunicação</h2>
                    <p className="text-muted-foreground font-light mt-1">Central de mensagens e avisos institucionais.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsMassCommOpen(true)}>
                        <Send className="mr-2 h-4 w-4" /> Nova Mensagem em Massa
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="announcements" className="w-full">
                <TabsList>
                    <TabsTrigger value="announcements">Comunicados</TabsTrigger>
                </TabsList>

                <TabsContent value="announcements" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">Indisponível no momento</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Msg. Enviadas</CardTitle>
                                <Send className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalSent}</div>
                                <p className="text-xs text-muted-foreground">Total histórico</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">Indisponível no momento</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Envios</CardTitle>
                            <CardDescription>Últimos comunicados disparados para a base.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : logs?.length ? (
                                <div className="space-y-8">
                                    {logs.map((item: any) => (
                                        <div key={item.id} className="flex items-center">
                                            <div className="space-y-1 flex-1">
                                                <p className="text-sm font-medium leading-none">{item.message.substring(0, 50)}{item.message.length > 50 ? '...' : ''}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')} • {item.type || 'Mass'} • Alcance: {item.recipient_count} alunos
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium">
                                                <Badge variant="success">Enviado</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground">Nenhum envio registrado.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {institutionalProfileId && (
                <MassCommunicationModal
                    isOpen={isMassCommOpen}
                    onClose={() => setIsMassCommOpen(false)}
                    institutionalProfileId={institutionalProfileId}
                    recipientIds={[]}
                    recipientCount={0}
                />
            )}
        </div>
    );
}
