import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { QuestionData } from './QuestionEditorModal';
import React from 'react';

interface SortableQuestionItemProps {
  question: QuestionData;
  icon: React.ElementType;
  isSelected: boolean;
  onEdit: (question: QuestionData) => void;
  onDelete: (questionId: string) => void;
}

export function SortableQuestionItem({ question, icon: Icon, isSelected, onEdit, onDelete }: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderContent = () => {
    switch (question.question_type) {
      case 'separator':
        return (
          <div className="relative py-2 w-full">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-sm text-muted-foreground">
                {question.question_text || 'Separador'}
              </span>
            </div>
          </div>
        );
      case 'page_break':
        return (
            <div className="relative py-2 w-full">
                <div className="w-full border-t border-dashed" />
                <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-sm font-medium text-primary -mt-3">
                        Quebra de Página
                    </span>
                </div>
            </div>
        );
      case 'header_image':
        return (
          <div className="p-4 flex w-full flex-col items-center justify-center bg-card border-2 border-dashed rounded-lg">
            {question.image_url ? (
              <img src={question.image_url} alt={question.question_text || 'Banner'} className="max-w-full h-auto rounded-md" />
            ) : (
              <p className="text-sm font-medium text-muted-foreground">Banner / Logo</p>
            )}
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <div>
                <p className="text-sm font-medium">{question.question_text}</p>
                <p className="text-xs text-muted-foreground">{question.description}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style}
        {...attributes}
        className={`p-4 flex items-center bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'border-primary' : ''}`}>
      
      <div {...listeners} className="cursor-grab pr-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        {renderContent()}
      </div>

      <div className="flex items-center gap-1 pl-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(question)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(question.id!)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
