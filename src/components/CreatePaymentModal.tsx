import React from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useStudentContext } from '@/contexts/StudentContext';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormData = {
  description: string;
  amount: number;
  due_date: Date;
  payment_type: 'link' | 'boleto';
  payment_url?: string;
  file?: FileList;
};

export const CreatePaymentModal = ({ isOpen, onClose }: CreatePaymentModalProps) => {
  const { studentProfileId, institutionalProfileId } = useStudentContext();
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
  const paymentType = watch('payment_type');

  const createPaymentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!institutionalProfileId) throw new Error('ID da instituição não encontrado.');
      if (!studentProfileId) throw new Error('ID do perfil do aluno não encontrado.'); // Use studentProfileId

      let filePath: string | undefined = undefined;
      const paymentUrl: string | undefined = formData.payment_url;

      // Step 1: Upload file if it's a 'boleto'
      if (formData.payment_type === 'boleto' && formData.file && formData.file.length > 0) {
        const file = formData.file[0];
        const fileName = `${Date.now()}_${file.name}`;
        const fullPath = `${institutionalProfileId}/${studentProfileId}/${fileName}`; // Use studentProfileId
        
        const { error: uploadError } = await supabase.storage
          .from('student_financials')
          .upload(fullPath, file);

        if (uploadError) throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
        filePath = fullPath;
      }

      // Step 2: Insert record into the database
      const { error: dbError } = await supabase
        .from('student_payments')
        .insert({
          student_profile_id: studentProfileId, // Use student_profile_id
          institutional_profile_id: institutionalProfileId,
          description: formData.description,
          amount: formData.amount,
          due_date: format(formData.due_date, 'yyyy-MM-dd'),
          payment_type: formData.payment_type,
          payment_url: paymentUrl,
          file_path: filePath,
          status: 'pending',
        });

      if (dbError) throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
    },
    onSuccess: () => {
      toast.success('Nova cobrança adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['student_payments_with_status', studentProfileId] }); // Updated query key
      reset();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cobrança: ${error.message}`);
    }
  });

  const onSubmit = (data: FormData) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Cobrança</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar uma nova cobrança para o aluno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register('description', { required: 'Descrição é obrigatória' })} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount', { required: 'Valor é obrigatório', valueAsNumber: true })} />
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
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione uma data</span>}
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
            <Label>Tipo de Pagamento</Label>
            <Controller
              name="payment_type"
              control={control}
              defaultValue="link"
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="r-link" />
                    <Label htmlFor="r-link">Link de Pagamento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="r-boleto" />
                    <Label htmlFor="r-boleto">Boleto (Arquivo)</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          {paymentType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="payment_url">URL do Link de Pagamento</Label>
              <Input id="payment_url" {...register('payment_url', { required: 'URL é obrigatória para tipo Link' })} />
              {errors.payment_url && <p className="text-sm text-destructive">{errors.payment_url.message}</p>}
            </div>
          )}
          {paymentType === 'boleto' && (
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo do Boleto (PDF, JPG, PNG)</Label>
              <Input id="file" type="file" {...register('file', { required: 'Arquivo é obrigatório para tipo Boleto' })} accept=".pdf,.jpg,.jpeg,.png" />
              {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Cobrança
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};