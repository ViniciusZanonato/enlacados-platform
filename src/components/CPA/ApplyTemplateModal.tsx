import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ChartConfig {
  id: string;
  title: string;
  type: string;
  dimension: string;
  dimensionY?: string | null;
  question_type?: string;
  columns?: string[];
  metric?: string;
  palette: string;
}

interface Question {
  id: string;
  question_text: string;
}

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (mappedCharts: ChartConfig[]) => void;
  template: { name: string; charts: ChartConfig[] } | null;
  questions: Question[];
}

export const ApplyTemplateModal = ({ isOpen, onClose, onApply, template, questions }: ApplyTemplateModalProps) => {
  const [mappedDimensions, setMappedDimensions] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (template) {
      const initialMap: { [key: string]: string } = {};
      template.charts.forEach(chart => {
        const foundQuestion = questions.find(q => q.question_text === chart.dimension);
        if (foundQuestion) {
          initialMap[chart.id] = foundQuestion.id;
        }
      });
      setMappedDimensions(initialMap);
    }
  }, [template, questions]);

  const handleApply = () => {
    if (!template) return;

    const mappedCharts = template.charts.map(chart => ({
      ...chart,
      dimension: mappedDimensions[chart.id] || chart.dimension,
    }));

    onApply(mappedCharts);
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aplicar Template: {template.name}</DialogTitle>
          <DialogDescription>
            Mapeie as perguntas do template para as perguntas do questionário atual.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {template.charts.map(chart => (
            <div key={chart.id} className="grid grid-cols-2 gap-4 items-center">
              <div>
                <p className="font-semibold">{chart.title}</p>
                <p className="text-sm text-muted-foreground">Pergunta no template: "{chart.dimension}"</p>
              </div>
              <Select
                value={mappedDimensions[chart.id] || ''}
                onValueChange={(value) => setMappedDimensions(prev => ({ ...prev, [chart.id]: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a pergunta correspondente" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map(q => (
                    <SelectItem key={q.id} value={q.id}>{q.question_text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleApply}>Aplicar Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
