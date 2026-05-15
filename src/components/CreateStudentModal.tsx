
import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const studentSchema = z.object({
  full_name: z.string().min(1, 'O nome completo é obrigatório.'),
  email: z.string().email('O email fornecido é inválido.'),
  cpf: z.string().length(11, 'O CPF deve ter 11 dígitos.').optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated: () => void;
}

export const CreateStudentModal = ({ isOpen, onClose, onStudentCreated }: CreateStudentModalProps) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
  });

  const onSubmit = async (data: StudentFormValues) => {
    setLoading(true);
    try {
      // O SDK Supabase inclui automaticamente o JWT do usuário autenticado no header
      // Authorization de todas as chamadas RPC. A RPC create_student repassa esse token
      // para a edge function send-invitation-email (TCK-2026-03-27-S3-005), que valida
      // que o chamador é um institutional_admin antes de disparar o e-mail de convite.
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_student', {
        p_cpf: data.cpf || null,
        p_full_name: data.full_name,
        p_email: data.email,
      });

      if (rpcError) throw rpcError;

      if (rpcData && !rpcData.success) {
        throw new Error(rpcData.message);
      }

      toast.success('Aluno criado com sucesso!');
      onStudentCreated();
      reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      toast.error(`Erro ao criar aluno: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Aluno</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar um novo aluno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" {...register('cpf')} />
            {errors.cpf && <p className="text-red-500 text-sm">{errors.cpf.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : 'Criar Aluno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
