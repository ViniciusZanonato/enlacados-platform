import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AcademicHistory } from '@/types/student-journey';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  grade: z.coerce.number().min(0).max(10).nullable(),
  absences: z.coerce.number().int().min(0).nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface EditGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AcademicHistory | null;
  onSave: (data: FormData) => void;
  isSaving: boolean;
}

const EditGradeModal = ({ isOpen, onClose, record, onSave, isSaving }: EditGradeModalProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: record?.grade,
      absences: record?.absences,
    }
  });

  // Reset form when the record changes
  React.useEffect(() => {
    if (record) {
      reset({
        grade: record.grade,
        absences: record.absences,
      });
    }
  }, [record, reset]);

  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Lançamento</DialogTitle>
          <DialogDescription>
            Modificando notas e faltas para <strong>{record.course_name}</strong> do semestre <strong>{record.semester}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="grade">Nota</Label>
            <Input id="grade" type="number" step="0.1" {...register('grade')} />
            {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>}
          </div>
          <div>
            <Label htmlFor="absences">Faltas</Label>
            <Input id="absences" type="number" {...register('absences')} />
            {errors.absences && <p className="text-red-500 text-sm mt-1">{errors.absences.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGradeModal;
