import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string) => void;
}

export const SaveTemplateModal = ({ isOpen, onClose, onSave }: SaveTemplateModalProps) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('O nome do template não pode ser vazio.');
      return;
    }
    onSave(name);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
          <DialogDescription>
            Dê um nome para o seu novo template de dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="template-name">Nome do Template</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Análise Geral de Cursos"
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
