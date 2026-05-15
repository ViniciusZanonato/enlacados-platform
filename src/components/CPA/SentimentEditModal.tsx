import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SentimentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResponseId: string | null;
  currentSentiment: string | null;
  onSave: (responseId: string, newSentiment: string) => void;
}

export const SentimentEditModal = ({
  isOpen,
  onClose,
  currentResponseId,
  currentSentiment,
  onSave,
}: SentimentEditModalProps) => {
  const [selectedSentiment, setSelectedSentiment] = useState<string>('NEUTRO');

  useEffect(() => {
    if (currentSentiment) {
      setSelectedSentiment(currentSentiment);
    } else {
      setSelectedSentiment('NEUTRO');
    }
  }, [currentSentiment]);

  const handleSave = () => {
    if (currentResponseId && selectedSentiment) {
      onSave(currentResponseId, selectedSentiment);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Sentimento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sentiment" className="text-right">
              Sentimento
            </Label>
            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOM">BOM</SelectItem>
                <SelectItem value="NEUTRO">NEUTRO</SelectItem>
                <SelectItem value="RUIM">RUIM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
