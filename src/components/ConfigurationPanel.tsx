import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  is_required?: boolean;
  description?: string;
  placeholder?: string;
  help_text?: string;
}

interface ConfigurationPanelProps {
  question: Question | null;
  onClose: () => void;
  onUpdate: (questionId: string, updates: Partial<Question>) => void;
}

const ConfigurationPanel = ({ question, onClose, onUpdate }: ConfigurationPanelProps) => {
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text || '');
      setIsRequired(question.is_required || false);
      setDescription(question.description || '');
      setPlaceholder(question.placeholder || '');
      setHelpText(question.help_text || '');
    } else {
      setQuestionText('');
      setIsRequired(false);
      setDescription('');
      setPlaceholder('');
      setHelpText('');
    }
  }, [question]);

  const handleSave = () => {
    if (!question) return;
    const updates: Partial<Question> = {
      question_text: questionText,
      is_required: isRequired,
      description: description,
      placeholder: placeholder,
      help_text: helpText,
    };
    onUpdate(question.id, updates);
  };

  if (!question) {
    return null;
  }

  return (
    <div className="w-80 p-4 border-l bg-card space-y-6 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Configurar Campo</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 flex-1">
        <div className="grid gap-2">
          <Label htmlFor="question-text">Nome do Campo (Label)</Label>
          <Input
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="help-text">Texto de Ajuda (para o ícone)</Label>
          <Textarea
            id="help-text"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="is-required">Campo Obrigatório</Label>
          <Switch
            id="is-required"
            checked={isRequired}
            onCheckedChange={setIsRequired}
          />
        </div>
      </div>

      <div className="mt-auto">
        <Button onClick={handleSave} className="w-full">Salvar Alterações</Button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
