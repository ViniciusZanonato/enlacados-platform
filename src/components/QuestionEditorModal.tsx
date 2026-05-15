import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, X, Plus, Trash2, CircleDot } from 'lucide-react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import ImageUpload from '@/features/profile/components/ImageUpload';

export interface AnswerOption {
  id?: string;
  question_id?: string;
  option_text: string;
  option_value?: string | number | undefined; // Allow string, number or undefined for value
  order_number: number;
}

export interface QuestionData {
  id?: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  description: string;
  placeholder: string;
  help_text: string;
  order_number: number;
  answer_options?: AnswerOption[];
  image_url?: string; // Add image_url to the interface
  min?: number; // For slider
  max?: number; // For slider
  step?: number; // For slider
}

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: Partial<QuestionData>, options: AnswerOption[]) => void;
  question: Partial<QuestionData> | null;
  saving: boolean;
}

const QuestionEditorModal = ({ isOpen, onClose, onSave, question, saving }: QuestionEditorModalProps) => {
  const [questionText, setQuestionText] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [showHelpText, setShowHelpText] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<AnswerOption[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined); // State for the image URL
  const [likertSteps, setLikertSteps] = useState(5);
  const [likertStartLabel, setLikertStartLabel] = useState('Discordo totalmente');
  const [likertEndLabel, setLikertEndLabel] = useState('Concordo totalmente');

  const isOptionsBased = question?.question_type === 'radio' || question?.question_type === 'checkbox' || question?.question_type === 'select';
  const isLikert = question?.question_type === 'likert';
  const isRating = question?.question_type === 'rating';
  const isSlider = question?.question_type === 'slider';
  const isHeaderImage = question?.question_type === 'header_image';

  useEffect(() => {
    if (isLikert || isRating) {
        const newOptions = Array.from({ length: likertSteps }, (_, i) => ({
            option_text: `${i + 1}`,
            option_value: i + 1,
            order_number: i + 1,
        }));
        setOptions(newOptions);
    } else if (isSlider) {
        // For slider, options might represent min/max/step or just be empty
        // We'll manage min/max/step via separate states
        setOptions([]);
    }
  }, [likertSteps, isLikert, isRating, isSlider]);

  useEffect(() => {
    const fetchData = async () => {
        if (isOpen && question) {
            setQuestionText(question.question_text || '');
            setIsRequired(question.is_required || false);
            setImageUrl(question.image_url || undefined); // Set image url from question data
            
            const hasDescription = !!question.description;
            setShowDescription(hasDescription);
            setDescription(question.description || '');

            const hasHelpText = !!question.helpText;
            setShowHelpText(hasHelpText);
            setHelpText(question.helpText || '');

            if (isLikert) {
                setLikertStartLabel(question.description || 'Discordo totalmente');
                setLikertEndLabel(question.help_text || 'Concordo totalmente');
            } else if (isSlider) {
                // For slider, description can be min, help_text can be step, likertSteps can be max
                setDescription(question.description || '0'); // min value
                setHelpText(question.help_text || '1'); // step value
                setLikertSteps(parseInt(question.placeholder || '100', 10)); // max value
            }

            if (isOptionsBased && question.id) {
                const { data, error } = await supabase
                    .from('cpa_answer_options')
                    .select('*')
                    .eq('question_id', question.id)
                    .order('order_number');
                if (error) {
                    toast.error('Erro ao carregar opções.');
                } else {
                    setOptions(data || []);
                }
            } else {
                setOptions([]);
            }

        } else {
            // Reset state when modal is closed or no question is provided
            setQuestionText('');
            setIsRequired(false);
            setShowDescription(false);
            setDescription('');
            setShowHelpText(false);
            setHelpText('');
            setOptions([]);
            setImageUrl(undefined);
            setLikertSteps(5); // Reset likert/rating steps
            setLikertStartLabel('Discordo totalmente'); // Reset likert labels
            setLikertEndLabel('Concordo totalmente'); // Reset likert labels
        }
    }
    fetchData();
  }, [isOpen, question, isOptionsBased, isLikert, isRating, isSlider]);

  const handleSave = () => {
    const questionData: Partial<QuestionData> = {
      ...question,
      question_text: questionText,
      is_required: isRequired,
      image_url: isHeaderImage ? imageUrl : undefined, // Add image_url to the saved data
    };

    if (isLikert) {
        questionData.description = likertStartLabel;
        questionData.help_text = likertEndLabel;
        questionData.placeholder = likertSteps.toString(); // Save steps in placeholder
    } else if (isRating) {
        questionData.description = likertStartLabel; // Label for 1 star
        questionData.help_text = likertEndLabel; // Label for max stars
        questionData.placeholder = likertSteps.toString(); // Number of stars
    } else if (isSlider) {
        questionData.description = description; // Min value
        questionData.help_text = helpText; // Step value
        questionData.placeholder = likertSteps.toString(); // Max value
    } else {
        questionData.description = showDescription ? description : '';
        questionData.help_text = showHelpText ? helpText : '';
        questionData.placeholder = ''; // Clear placeholder for other types
    }

    onSave(questionData, options);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', option_value: '', order_number: options.length + 1 }]);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = text;
    setOptions(newOptions);
  };

  const handleOptionValueChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].option_value = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const isSeparator = question?.question_type === 'separator';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{question?.id ? 'Editar Campo' : 'Adicionar Novo Campo'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="question-text">
              {isSeparator ? 'Texto do Separador (opcional)' : isHeaderImage ? 'Título do Banner (interno)' : 'Título do Campo'}
            </Label>
            <Input
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={isSeparator ? 'Ex: Informações Pessoais' : isHeaderImage ? 'Ex: Logo da Empresa' : 'Digite o título para este campo'}
            />
          </div>

          {isHeaderImage && (
            <div className="grid gap-2">
              <Label htmlFor="image-upload">Upload do Banner/Logo</Label>
              <ImageUpload
                bucket="questionnaire_assets" // You'll need to create this bucket in Supabase
                onUpload={(url) => setImageUrl(url)}
                initialUrl={imageUrl}
              />
              {imageUrl && <p className="text-xs text-muted-foreground">URL: {imageUrl}</p>}
            </div>
          )}

          {!isSeparator && !isHeaderImage && (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="show-description" checked={showDescription} onCheckedChange={setShowDescription} />
                  <Label htmlFor="show-description">Adicionar descrição?</Label>
                </div>
                {showDescription && (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Digite a descrição do campo"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is-required" checked={isRequired} onCheckedChange={setIsRequired} />
                <Label htmlFor="is-required">Obrigatório?</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="show-help-text" checked={showHelpText} onCheckedChange={setShowHelpText} />
                <Label htmlFor="show-help-text">Adicionar texto de ajuda?</Label>
              </div>
              {showHelpText && (
                <Textarea
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Digite o texto de ajuda para o ícone"
                />
              )}
            </>
          )}

          {isOptionsBased && (
            <div className="space-y-4">
                <Label>Opções de Resposta</Label>
                <>
                    <div className="space-y-2">
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input 
                                    value={opt.option_text} 
                                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                    placeholder={`Texto da Opção ${index + 1}`}
                                    className="flex-1"
                                />
                                <Input 
                                    value={opt.option_value || ''} 
                                    onChange={(e) => handleOptionValueChange(index, e.target.value)}
                                    placeholder={`Valor (opcional)`}
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddOption}><Plus className="mr-2 h-4 w-4"/>Adicionar Opção</Button>
                </>
            </div>
          )}

          {isLikert && (
            <div className="space-y-4">
                <Label>Configurações da Escala Likert</Label>
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <div className='grid grid-cols-3 gap-4'>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="likert-steps">Pontos na Escala</Label>
                            <Input
                                id="likert-steps"
                                type="number"
                                value={likertSteps}
                                onChange={(e) => setLikertSteps(parseInt(e.target.value, 10) || 5)}
                                min={2}
                                max={10}
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="likert-start-label">Rótulo Inicial (1)</Label>
                            <Input
                                id="likert-start-label"
                                value={likertStartLabel}
                                onChange={(e) => setLikertStartLabel(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 col-span-3">
                            <Label htmlFor="likert-end-label">Rótulo Final ({likertSteps})</Label>
                            <Input
                                id="likert-end-label"
                                value={likertEndLabel}
                                onChange={(e) => setLikertEndLabel(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-md">
                        <span className='text-sm font-medium text-muted-foreground'>{likertStartLabel}</span>
                        <div className='flex items-center gap-2'>
                            {options.map(opt => (
                                <div key={opt.option_value} className='flex flex-col items-center'>
                                    <span className='text-xs'>{opt.option_value}</span>
                                    <CircleDot className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                            ))}
                        </div>
                        <span className='text-sm font-medium text-muted-foreground'>{likertEndLabel}</span>
                    </div>
                </div>
            </div>
          )}

          {isRating && (
            <div className="space-y-4">
                <Label>Configurações de Avaliação por Estrelas</Label>
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <div className='grid grid-cols-3 gap-4'>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="rating-steps">Número de Estrelas</Label>
                            <Input
                                id="rating-steps"
                                type="number"
                                value={likertSteps} // Reusing likertSteps for number of stars
                                onChange={(e) => setLikertSteps(parseInt(e.target.value, 10) || 5)}
                                min={2}
                                max={10}
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="rating-start-label">Rótulo Mínimo (1 estrela)</Label>
                            <Input
                                id="rating-start-label"
                                value={likertStartLabel}
                                onChange={(e) => setLikertStartLabel(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 col-span-3">
                            <Label htmlFor="rating-end-label">Rótulo Máximo ({likertSteps} estrelas)</Label>
                            <Input
                                id="rating-end-label"
                                value={likertEndLabel}
                                onChange={(e) => setLikertEndLabel(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
          )}

          {isSlider && (
            <div className="space-y-4">
                <Label>Configurações do Slider Numérico</Label>
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <div className='grid grid-cols-3 gap-4'>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="slider-min">Valor Mínimo</Label>
                            <Input
                                id="slider-min"
                                type="number"
                                value={description} // Using description for min value
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="slider-max">Valor Máximo</Label>
                            <Input
                                id="slider-max"
                                type="number"
                                value={likertSteps} // Reusing likertSteps for max value
                                onChange={(e) => setLikertSteps(parseInt(e.target.value, 10) || 100)}
                            />
                        </div>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="slider-step">Passo</Label>
                            <Input
                                id="slider-step"
                                type="number"
                                value={helpText} // Using helpText for step value
                                onChange={(e) => setHelpText(e.target.value)}
                                min={1}
                            />
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionEditorModal;
