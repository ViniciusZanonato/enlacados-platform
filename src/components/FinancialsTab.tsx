import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreVertical, Trash2, CheckCircle2, ArrowDownToLine, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { CreatePaymentModal } from './CreatePaymentModal'; 
import { useStudentPayments, useUpdatePaymentStatus, useDeletePayment, StudentPayment } from '@/hooks/useStudentFinancials';
import { useStudentContext } from '@/contexts/StudentContext';

const FinancialsTab = () => {
  const { studentProfileId, institutionalProfileId } = useStudentContext();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const { data: payments, isLoading, isError } = useStudentPayments(studentProfileId);
  const updateStatusMutation = useUpdatePaymentStatus(studentProfileId);
  const deletePaymentMutation = useDeletePayment(studentProfileId);

  const handleMarkAsPaid = (paymentId: string) => {
    if (!confirm('Tem certeza que deseja marcar esta cobrança como paga?')) return;
    updateStatusMutation.mutate({ paymentId, status: 'paid' });
  };
  
  const handleDelete = (paymentId: string) => {
    if (!confirm('Tem certeza que deseja remover esta cobrança? Esta ação não pode ser desfeita.')) return;
    deletePaymentMutation.mutate(paymentId);
  };

  const balance = payments?.reduce((acc, p) => {
    return p.status === 'pending' || p.status === 'overdue' ? acc + p.amount : acc;
  }, 0) ?? 0;

  const nextDueDate = payments?.find(p => p.status === 'pending' && new Date(p.due_date) >= new Date());

  const getStatusBadge = (status: StudentPayment['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Pago</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão Financeira</h2>
        <Button onClick={() => setCreateModalOpen(true)} disabled={!institutionalProfileId}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Cobrança
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
                   <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className={`text-2xl font-bold ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                  </div>
                  <p className="text-xs text-muted-foreground">Soma de todas as cobranças pendentes.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
                   <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                    {nextDueDate ? format(parseISO(nextDueDate.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                  </div>
                   <p className="text-xs text-muted-foreground">{nextDueDate?.description ?? 'Nenhuma fatura em aberto.'}</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Status Financeiro</CardTitle>
                   <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className={`text-2xl font-bold ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{balance > 0 ? 'Pendente' : 'Em dia'}</div>
                  <p className="text-xs text-muted-foreground">Status geral da conta do aluno.</p>
              </CardContent>
          </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
           {isLoading && <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
           {isError && <p className="text-center text-destructive p-8">Erro ao carregar dados financeiros.</p>}
           {!isLoading && !isError && payments && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.description}</TableCell>
                    <TableCell>{format(parseISO(p.due_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {p.payment_type === 'link' && p.payment_url && (
                             <DropdownMenuItem asChild>
                               <a href={p.payment_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                 <LinkIcon className="mr-2 h-4 w-4" /> Ver Link de Pagamento
                               </a>
                             </DropdownMenuItem>
                          )}
                           {p.payment_type === 'boleto' && p.file_path && (
                             <DropdownMenuItem disabled>
                                <ArrowDownToLine className="mr-2 h-4 w-4" /> Baixar Boleto
                             </DropdownMenuItem>
                          )}
                          {p.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(p.id)} className="cursor-pointer">
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar Cobrança
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           )}
           {!isLoading && !isError && payments?.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma cobrança encontrada para este aluno.</p>
              </div>
           )}
        </CardContent>
      </Card>
      
      <CreatePaymentModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default FinancialsTab;