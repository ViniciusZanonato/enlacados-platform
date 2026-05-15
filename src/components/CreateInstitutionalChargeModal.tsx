import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import UserSearchInput from './UserSearchInput';

interface CreateInstitutionalChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionalProfileId: string | null;
}

type FormData = {
  description: string;
  amount: number;
  due_date: Date;
  payment_type: 'link' | 'boleto';
  payment_url?: string;
  file?: FileList;
};

interface SelectedUser {
    id: string;
    full_name: string;
    email: string;
    cpf?: string;
}

export const CreateInstitutionalChargeModal = ({ isOpen, onClose, institutionalProfileId }: CreateInstitutionalChargeModalProps) => {
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      payment_type: 'link'
    }
  });
  
  const paymentType = watch('payment_type');

  const createChargeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!institutionalProfileId) throw new Error('ID da instituição não vinculado ao seu perfil.');
      if (!selectedUser?.cpf) throw new Error('É necessário selecionar um aluno com CPF cadastrado.');

      let filePath: string | undefined = undefined;
      const paymentUrl: string | undefined = formData.payment_url;

      // 1. Upload file if it's a 'boleto'
      if (formData.payment_type === 'boleto' && formData.file && formData.file.length > 0) {
        const file = formData.file[0];
        const fileName = `${Date.now()}_charges_${file.name}`;
        const fullPath = `${institutionalProfileId}/${selectedUser.cpf}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student_financials')
          .upload(fullPath, file);

        if (uploadError) throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
        filePath = fullPath;
      }

      // 2. Insert record into student_payments
      // This will trigger the sync to financial_transactions on the database side
      const { error: dbError } = await supabase
        .from('student_payments')
        .insert({
          student_cpf: selectedUser.cpf,
          institutional_profile_id: institutionalProfileId,
          description: formData.description,
          amount: formData.amount,
          due_date: format(formData.due_date, 'yyyy-MM-dd'),
          payment_type: formData.payment_type,
          payment_url: paymentUrl,
          file_path: filePath,
          status: 'pending',
        });

      if (dbError) throw new Error(`Erro ao salvar cobrança: ${dbError.message}`);
    },
    onSuccess: () => {
      toast.success('Cobrança institucional criada e sincronizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cobrança: ${error.message}`);
    }
  });

  const handleClose = () => {
      reset();
      setSelectedUser(null);
      setSearchEmail('');
      onClose();
  };

  const onSubmit = (data: FormData) => {
    createChargeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança Institucional</DialogTitle>
          <DialogDescription>
            Crie uma cobrança para um aluno e acompanhe o recebimento no fluxo de caixa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Search */}
          <div className="space-y-2">
            <Label>Buscar Aluno (Nome, Email ou CPF)</Label>
            <UserSearchInput 
                value={searchEmail}
                onChange={setSearchEmail}
                onSelectUser={(user) => setSelectedUser(user as SelectedUser)}
                placeholder="Digite para pesquisar..."
                disabled={isSubmitting}
            />
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold">{selectedUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email} • {selectedUser.cpf ? `CPF: ${selectedUser.cpf}` : <span className="text-destructive font-bold">Sem CPF</span>}</p>
                </div>
                {!selectedUser.cpf && (
                    <div className="ml-auto text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                        Incompatível
                    </div>
                )}
            </div>
          )}

          <hr />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Serviço / Mensalidade</Label>
              <Input id="description" placeholder="Ex: Mensalidade Abril - Administração" {...register('description', { required: 'Descrição é obrigatória' })} disabled={isSubmitting} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount', { required: 'Valor é obrigatório', min: { value: 0.01, message: 'Valor deve ser positivo' } })} disabled={isSubmitting} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Controller
                  name="due_date"
                  control={control}
                  rules={{ required: 'Data de vencimento é obrigatória' }}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          disabled={isSubmitting}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Controller
                name="payment_type"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={isSubmitting}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="link" id="charge-link" />
                      <Label htmlFor="charge-link">Link Externo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="boleto" id="charge-boleto" />
                      <Label htmlFor="charge-boleto">Boleto / Anexo</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {paymentType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="payment_url">URL do Link de Pagamento (Stripe, PagSeguro, etc.)</Label>
                <Input id="payment_url" placeholder="https://..." {...register('payment_url', { required: 'URL é necessária' })} disabled={isSubmitting} />
                {errors.payment_url && <p className="text-sm text-destructive">{errors.payment_url.message}</p>}
              </div>
            )}

            {paymentType === 'boleto' && (
              <div className="space-y-2">
                <Label htmlFor="file">Upload do Documento (PDF ou Imagem)</Label>
                <Input id="file" type="file" {...register('file', { required: 'Arquivo é obrigatório' })} accept=".pdf,.jpg,.jpeg,.png" disabled={isSubmitting} />
                {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
              </div>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || !selectedUser?.cpf} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar e Notificar Aluno
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
