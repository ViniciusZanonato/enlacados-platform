import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: unknown;
}

export const CreateCourseModal = ({ isOpen, onClose }: CreateCourseModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Curso</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm py-4">
          Funcionalidade em desenvolvimento.
        </p>
      </DialogContent>
    </Dialog>
  );
};
