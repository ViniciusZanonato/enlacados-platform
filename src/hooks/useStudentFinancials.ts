import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';

// Define the type for a payment record
export interface StudentPayment {
  id: string;
  student_profile_id: string;
  institutional_profile_id: string;
  description: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  payment_type: 'boleto' | 'link';
  payment_url: string | null;
  file_path: string | null;
  created_at: string;
  paid_at: string | null;
}

// Custom hook to fetch student payments
export const useStudentPayments = (studentProfileId: string | undefined) => {
  return useQuery<StudentPayment[], Error>({
    queryKey: ['student_payments_with_status', studentProfileId], // Changed query key
    queryFn: async () => {
      if (!studentProfileId) throw new Error("Student Profile ID is required.");

      // Query the new view instead of the table
      const { data, error } = await supabase
        .from('student_payments_with_status')
        .select('*')
        .eq('student_profile_id', studentProfileId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      
      // The logic on the client is now gone
      return data || [];
    },
    enabled: !!studentProfileId,
  });
};

// Custom hook to update payment status
export const useUpdatePaymentStatus = (studentProfileId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { paymentId: string, status: 'paid' | 'pending' }>({
    mutationFn: async ({ paymentId, status }) => {
      // Mutation still happens on the base table
      const { error } = await supabase
        .from('student_payments')
        .update({ status: status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status do pagamento atualizado!');
      // Invalidate the query that uses the view
      queryClient.invalidateQueries({ queryKey: ['student_payments_with_status', studentProfileId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });
};

// Custom hook to delete a payment
export const useDeletePayment = (studentProfileId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (paymentId) => {
      // Step 1: Get the payment record to find the file path
      const { data: payment, error: fetchError } = await supabase
        .from('student_payments')
        .select('file_path')
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        throw new Error(`Could not fetch payment details: ${fetchError.message}`);
      }

      // Step 2: If a file exists, delete it from storage
      if (payment?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('public_documents')
          .remove([payment.file_path]);
        
        if (storageError) {
          throw new Error(`Failed to delete file from storage: ${storageError.message}`);
        }
      }

      // Step 3: Delete the database record
      const { error: deleteError } = await supabase.from('student_payments').delete().eq('id', paymentId);
      if (deleteError) {
        throw new Error(`Failed to delete payment record: ${deleteError.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Cobrança removida com sucesso!');
      // Invalidate the query that uses the view
      queryClient.invalidateQueries({ queryKey: ['student_payments_with_status', studentProfileId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cobrança: ${error.message}`);
    }
  });
};