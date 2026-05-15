import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, AlertCircle, Calendar, Loader2, FileDown, ShieldCheck } from 'lucide-react';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { format, isSameMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreateInstitutionalChargeModal } from '@/components/CreateInstitutionalChargeModal';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function FinancePage() {
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);

    // 1. Get institutional_profile_id first
    const { data: instProfile, isLoading: isInstLoading } = useQuery({
        queryKey: ['myInstitutionalProfile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { data: instData } = await supabase
                .from('institutional_profiles')
                .select('id, institution_name')
                .eq('profile_id', profile.id)
                .single();

            return instData;
        }
    });

    // 2. Fetch transactions filtered by institution
    const { data: transactions, isLoading: isTxLoading } = useQuery({
        queryKey: ['financialTransactions', instProfile?.id],
        queryFn: async () => {
            if (!instProfile?.id) return [];
            
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*, profiles(full_name)')
                .eq('institutional_profile_id', instProfile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!instProfile?.id
    });

    const metrics = useMemo(() => {
        if (!transactions) return { revenue: 0, pending: 0, overdue: 0, paidCount: 0 };

        let revenue = 0;
        let pending = 0;
        let overdue = 0;
        let paidCount = 0;

        transactions.forEach(t => {
            if (t.transaction_type === 'invoice' || t.transaction_type === 'fine') {
                const amount = Number(t.amount);
                if (t.status === 'paid') {
                    revenue += amount;
                    paidCount++;
                } else if (t.status === 'pending') {
                    pending += amount;
                } else if (t.status === 'overdue') {
                    overdue += amount;
                }
            }
        });

        return { revenue, pending, overdue, paidCount };
    }, [transactions]);

    const chartData = useMemo(() => {
        if (!transactions) return [];
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

        return months.map(date => {
            const revenue = transactions
                .filter(t => isSameMonth(new Date(t.created_at), date) && t.status === 'paid' && (t.transaction_type === 'invoice' || t.transaction_type === 'fine'))
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            return {
                name: format(date, 'MMM', { locale: ptBR }),
                receita: revenue
            };
        });
    }, [transactions]);

    const handleExportPDF = () => {
        if (!transactions || transactions.length === 0) {
            toast.error('Não há dados para exportar.');
            return;
        }

        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.setTextColor(22, 163, 74);
            doc.text(`Relatório Financeiro - ${instProfile?.institution_name || 'Institucional'}`, 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
            doc.text(`Total de Transações: ${transactions.length}`, 14, 35);

            // Metrics Summary
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Resumo de Caixa', 14, 45);
            doc.setFontSize(10);
            doc.text(`Receita Total: R$ ${metrics.revenue.toLocaleString('pt-BR')}`, 14, 52);
            doc.text(`Valores Pendentes: R$ ${metrics.pending.toLocaleString('pt-BR')}`, 14, 57);
            doc.text(`Valores em Atraso: R$ ${metrics.overdue.toLocaleString('pt-BR')}`, 14, 62);

            const maskName = (name: string) => {
                if (!name) return 'N/A';
                const parts = name.split(' ');
                return parts.map(p => p.length > 2 ? p[0] + '***' : p).join(' ');
            };

            const tableColumn = ["Data", "Aluno", "Descrição", "Tipo", "Status", "Valor"];
            const tableRows = transactions.slice(0, 50).map((t: any) => [
                format(new Date(t.created_at), 'dd/MM/yyyy'),
                maskName(t.profiles?.full_name),
                t.description || '',
                t.transaction_type,
                t.status,
                `R$ ${Number(t.amount).toLocaleString('pt-BR')}`
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] },
            });

            doc.save(`financeiro_${instProfile?.institution_name}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            toast.success('Relatório gerado com sucesso!');
        } catch (err) {
            console.error('PDF Error:', err);
            toast.error('Erro ao gerar o PDF.');
        }
    };

    const overdueList = transactions?.filter(t => (t.status === 'overdue' || (t.status === 'pending' && new Date(t.due_date!) < new Date())));

    if (isInstLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <span className="label-pill text-primary/70 block mb-1">Portal institucional</span>
                    <h2 className="text-4xl leading-none">Financeiro</h2>
                    <p className="text-muted-foreground">{instProfile?.institution_name} • Visão geral do fluxo de caixa.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF} disabled={isTxLoading}>
                        <FileDown className="mr-2 h-4 w-4" /> Relatórios
                    </Button>
                    <Button onClick={() => setIsChargeModalOpen(true)}>
                        <DollarSign className="mr-2 h-4 w-4" /> Nova Cobrança
                    </Button>
                </div>
            </div>

            {isTxLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <InsightCard
                            title="Receita Total"
                            value={`R$ ${metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            icon={TrendingUp}
                        />
                        <InsightCard
                            title="Pagamentos Realizados"
                            value={metrics.paidCount.toString()}
                            icon={Users}
                            description="Faturas quitadas"
                        />
                        <InsightCard
                            title="Inadimplência (Total)"
                            value={`R$ ${metrics.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            icon={AlertCircle}
                            description="Valores em atraso"
                        />
                        <InsightCard
                            title="A Receber"
                            value={`R$ ${metrics.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            icon={Calendar}
                            description="Faturas pendentes não vencidas"
                        />
                    </div>

                    {/* Recent Transactions & Overview */}
                    <div className="grid gap-6 md:grid-cols-7">
                        <Card className="md:col-span-4">
                            <CardHeader>
                                <CardTitle>Fluxo de Receita (Últimos 6 Meses)</CardTitle>
                                <CardDescription>Receita confirmada por mês</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                                            <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Últimas Movimentações</CardTitle>
                                <CardDescription>Transações recentes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                    {transactions?.slice(0, 10).map((t: any) => (
                                        <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${t.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    <DollarSign className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{t.description || 'Pagamento'}</p>
                                                    <p className="text-xs text-muted-foreground">{t.profiles?.full_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold ${t.transaction_type === 'payment' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {t.transaction_type === 'payment' ? '+' : ''} R$ {Number(t.amount).toLocaleString('pt-BR')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'dd/MM')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {!transactions?.length && <p className="text-muted-foreground text-sm">Nenhuma transação encontrada.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Inadimplentes</CardTitle>
                            <CardDescription>Alunos com pendências financeiras vencidas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {overdueList && overdueList.length > 0 ? (
                                    overdueList.map((t: any) => (
                                        <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg bg-red-50/20 border-red-100">
                                            <div>
                                                <p className="font-semibold">{t.profiles?.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{t.description} - Vencido em {t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : 'N/A'}</p>
                                            </div>
                                            <div className="text-red-600 font-bold">
                                                R$ {Number(t.amount).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">Nenhum inadimplente registrado.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* LGPD Audit Footer */}
                    <div className="mt-12 flex items-center gap-2 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20 italic text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Todas as ações financeiras registradas neste painel são auditadas e armazenadas para fins de conformidade jurídica e defesa institucional.</span>
                    </div>
                </>
            )}

            <CreateInstitutionalChargeModal 
                isOpen={isChargeModalOpen} 
                onClose={() => setIsChargeModalOpen(false)} 
                institutionalProfileId={instProfile?.id}
            />
        </div>
    );
}
