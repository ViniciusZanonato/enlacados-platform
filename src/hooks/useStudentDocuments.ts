import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';

export interface StudentDocument {
  id: string;
  student_profile_id: string;
  document_type: string;
  file_path: string;
  status: 'pending_validation' | 'validated' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

// Custom hook to fetch student documents
export const useStudentDocuments = (studentProfileId: string) => {
  return useQuery<StudentDocument[], Error>({
    queryKey: ['documents', studentProfileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_profile_id', studentProfileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentProfileId,
  });
};

// Custom hook to upload a student document
export const useUploadStudentDocument = (studentProfileId: string, institutionalProfileId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { file: File, documentType: string }>({
    mutationFn: async ({ file, documentType }) => {
      if (!institutionalProfileId) {
        throw new Error("Institutional Profile ID is required for document upload.");
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `student_documents/${institutionalProfileId}/${studentProfileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_documents') // Assuming a public bucket for student documents
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      const { error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_profile_id: studentProfileId,
          document_type: documentType,
          file_path: filePath,
          status: 'pending_validation',
        });

      if (dbError) {
        // If DB insert fails, try to delete the uploaded file
        await supabase.storage.from('public_documents').remove([filePath]);
        throw new Error(`Error saving document record: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Documento enviado com sucesso para validação!');
      queryClient.invalidateQueries({ queryKey: ['documents', studentProfileId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar documento: ${error.message}`);
    }
  });
};
