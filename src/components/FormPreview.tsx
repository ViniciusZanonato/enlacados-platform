import React from 'react';
import { QuestionData } from './QuestionEditorModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, CircleDot } from 'lucide-react';

interface FormPreviewProps {
  questions: QuestionData[];
}

const FormPreview: React.FC<FormPreviewProps> = ({ questions }) => {
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-bold mb-4">Prévia do Formulário</h2>
      {questions.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma pergunta adicionada ainda.</p>
      ) : (
        questions.map((question, index) => {
          const commonProps = {
            id: question.id || `question-${index}`,
            placeholder: question.placeholder || '',
            disabled: true, // Disable inputs in preview mode
          };

          const renderInput = () => {
            switch (question.question_type) {
              case 'text':
              case 'number':
              case 'email':
              case 'tel':
                return <Input type={question.question_type} {...commonProps} />;
              case 'textarea':
                return <Textarea {...commonProps} />;
              case 'radio':
                return (
                  <RadioGroup {...commonProps}>
                    {question.answer_options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.option_text} id={`${commonProps.id}-opt-${optIndex}`} />
                        <Label htmlFor={`${commonProps.id}-opt-${optIndex}`}>{option.option_text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                );
              case 'checkbox':
                return (
                  <div className="space-y-2">
                    {question.answer_options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <Checkbox id={`${commonProps.id}-opt-${optIndex}`} />
                        <Label htmlFor={`${commonProps.id}-opt-${optIndex}`}>{option.option_text}</Label>
                      </div>
                    ))}
                  </div>
                );
              case 'select':
                return (
                  <Select {...commonProps}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.answer_options?.map((option, optIndex) => (
                        <SelectItem key={optIndex} value={option.option_text}>
                          {option.option_text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              case 'likert': {
                const likertSteps = parseInt(question.placeholder || '5', 10);
                const likertStartLabel = question.description || 'Discordo totalmente';
                const likertEndLabel = question.help_text || 'Concordo totalmente';
                return (
                  <div className="w-full pt-2">
                    <RadioGroup {...commonProps} className="flex justify-between items-center">
                      {Array.from({ length: likertSteps }).map((_, i) => {
                        const value = (i + 1).toString();
                        return (
                          <div key={i} className="flex flex-col items-center space-y-2">
                            <Label htmlFor={`${commonProps.id}-opt-${i}`} className="text-sm">{value}</Label>
                            <RadioGroupItem value={value} id={`${commonProps.id}-opt-${i}`} className="h-8 w-8" />
                          </div>
                        );
                      })}
                    </RadioGroup>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                      <span className="w-1/3 text-left">{likertStartLabel}</span>
                      <span className="w-1/3 text-right">{likertEndLabel}</span>
                    </div>
                  </div>
                );
              }
              case 'rating': {
                const numStars = parseInt(question.placeholder || '5', 10);
                const ratingStartLabel = question.description || 'Ruim';
                const ratingEndLabel = question.help_text || 'Excelente';
                return (
                  <div className="flex flex-col items-center p-3 border rounded-md bg-secondary/30">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: numStars }).map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <div className="flex justify-between w-full text-xs text-muted-foreground">
                      <span>{ratingStartLabel}</span>
                      <span>{ratingEndLabel}</span>
                    </div>
                  </div>
                );
              }
              case 'slider': {
                const min = parseInt(question.description || '0', 10);
                const max = parseInt(question.placeholder || '100', 10);
                const step = parseInt(question.help_text || '1', 10);
                return (
                  <div className="p-3 border rounded-md bg-secondary/30">
                    <Input type="range" min={min} max={max} step={step} value={min + (max - min) / 2} disabled className="w-full" />
                    <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                      <span>Min: {min}</span>
                      <span>Max: {max}</span>
                      <span>Passo: {step}</span>
                    </div>
                  </div>
                );
              }
              case 'separator':
              case 'page_break':
                return (
                  <div className="relative py-2 w-full">
                    <div className="w-full border-t border-dashed" />
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-gray-800 px-2 text-sm font-medium text-primary -mt-3">
                        Quebra de Página
                      </span>
                    </div>
                  </div>
                );
              case 'header_image':
                return (
                  <div className="p-4 flex w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 border-2 border-dashed rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">[Banner / Logo Placeholder]</p>
                  </div>
                );
              default:
                return <Input {...commonProps} />;
            }
          };

          return (
            <div key={question.id || index} className="space-y-2 border-b pb-4 last:border-b-0">
              <Label htmlFor={commonProps.id} className="text-base font-semibold">
                {question.question_text} {question.is_required && <span className="text-red-500">*</span>}
              </Label>
              {question.description && question.question_type !== 'likert' && <p className="text-sm text-muted-foreground">{question.description}</p>}
              {renderInput()}
              {question.help_text && question.question_type !== 'likert' && <p className="text-xs text-muted-foreground mt-1">{question.help_text}</p>}
            </div>
          );
        })
      )}
    </div>
  );
};

export default FormPreview;
