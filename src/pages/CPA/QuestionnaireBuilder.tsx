import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Link as CopyLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FieldsSidebar from '@/components/FieldsSidebar';
import QuestionEditorModal, { QuestionData, AnswerOption } from '@/components/QuestionEditorModal';
import { DndContext, rectIntersection, DragEndEvent, DragStartEvent, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableQuestionItem } from '@/components/SortableQuestionItem';
import { allFields } from '@/data/formFields';
import { FieldPreview } from '@/components/FieldPreview';
import FormPreview from '@/components/FormPreview';
import * as questionnaireApi from '@/features/questionnaire/api';

const fieldMap = allFields.reduce((acc, field) => {
  acc[field.type] = field;
  return acc;
}, {} as Record<string, { type: string; label: string; icon: React.ElementType }>);

type ActiveDragItem = (typeof allFields[0] & { fromSidebar: true; icon: any }) | QuestionData;

const QuestionnaireBuilder = () => {
  const { id: questionnaireId } = useParams() as { id: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionData> | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'droppable-canvas' });

  // --- Data Fetching ---
  const { data: questionnaire, isLoading: isLoadingQuestionnaire } = useQuery({
    queryKey: ['questionnaire', questionnaireId],
    queryFn: () => questionnaireApi.getQuestionnaire(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: initialQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['questions', questionnaireId],
    queryFn: () => questionnaireApi.getQuestions(questionnaireId),
    enabled: !!questionnaireId,
  });

  const [initializedId, setInitializedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestions && questionnaireId !== initializedId) {
      setQuestions(initialQuestions);
      setInitializedId(questionnaireId);
    }
  }, [initialQuestions, questionnaireId, initializedId]);
  // --- Mutations ---
  const saveQuestionMutation = useMutation({
    mutationFn: ({ questionData, options }: { questionData: Partial<QuestionData>, options: AnswerOption[] }) => {
      const isTempId = questionData.id && questionData.id.startsWith('temp-');

      // If it's a new question with a temporary ID, do not send the ID to the backend.
      if (isTempId) {
        const { id, ...dataForInsert } = questionData;
        return questionnaireApi.saveQuestionAndOptions(questionnaireId, dataForInsert, options);
      }

      // Otherwise, it's an update, so send the data as is.
      return questionnaireApi.saveQuestionAndOptions(questionnaireId, questionData, options);
    },
    onSuccess: (savedQuestion) => {
      const editingId = editingQuestion!.id; // An ID is always present now when editing/creating

      // Replace the question in the array with the version returned from the DB.
      // This works for both replacing a temp item and updating an existing one.
      const nextQuestions = questions.map(q => (q.id === editingId ? savedQuestion : q));

      // After updating the question, re-calculate order and trigger reorder mutation
      const updates = nextQuestions.map((q, index) => ({ id: q.id!, order_number: index + 1 }));
      reorderMutation.mutate(updates, {
        onSuccess: () => {
          // The ideal state is the reordered list.
          setQuestions(nextQuestions.map((q, index) => ({ ...q, order_number: index + 1 })));
        },
        onError: () => {
          // If reorder fails, at least show the updated question.
          setQuestions(nextQuestions);
          toast.error("A ordem das perguntas não pôde ser salva.");
        }
      });

      const wasAnUpdate = !editingId.startsWith('temp-');
      toast.success(`Pergunta ${wasAnUpdate ? 'atualizada' : 'criada'} com sucesso!`);

      // Directly close the modal and reset state here.
      setIsModalOpen(false);
      setEditingQuestion(null);
    },
    onError: (error: Error) => toast.error(`Erro ao salvar: ${error.message}`),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => questionnaireApi.deleteQuestion(questionId),
    onSuccess: (questionId) => {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Pergunta excluída com sucesso!');
    },
    onError: (error: Error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; order_number: number }[]) => questionnaireApi.reorderQuestions(updates),
    onSuccess: () => toast.success('Ordem salva!'),
    onError: () => toast.error('Não foi possível salvar a nova ordem.'),
  });

  const templateMutation = useMutation({
    mutationFn: (templateId: string) => questionnaireApi.insertTemplate(templateId, questionnaireId),
    onSuccess: (newQuestions) => {
      setQuestions(newQuestions);
      toast.success('Template aplicado com sucesso!');
      navigate(`/questionnaire/builder/${questionnaireId}`, { replace: true });
    },
    onError: (error: Error) => toast.error(`Erro ao aplicar template: ${error.message}`),
  });

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId && initialQuestions?.length === 0) {
      templateMutation.mutate(templateId);
    }
  }, [searchParams, initialQuestions, templateMutation]);


  // --- Event Handlers ---
  const handleAddFieldClick = (type: string) => {
    const fieldType = type;
    if (!fieldType) return;

    const tempId = `temp-${Date.now()}`;
    const newQuestion: Partial<QuestionData> = { id: tempId, question_type: fieldType, question_text: fieldMap[fieldType].label };

    setQuestions(prev => [...prev, newQuestion as QuestionData]);
    setEditingQuestion(newQuestion);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (question: QuestionData) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    // If we were editing a temporary question, remove it on cancel.
    if (editingQuestion?.id && editingQuestion.id.startsWith('temp-')) {
      setQuestions(prev => prev.filter(q => q.id !== editingQuestion.id));
    }
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = (questionData: Partial<QuestionData>, options: AnswerOption[]) => {
    saveQuestionMutation.mutate({ questionData, options });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (questionId.startsWith('temp-')) {
      setQuestions(questions.filter(q => q.id !== questionId));
      toast.success('Pergunta removida.');
    } else {
      if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.fromSidebar) {
      const fieldType = active.data.current?.type;
      setActiveDragItem({ ...fieldMap[fieldType], fromSidebar: true } as any);
    } else {
      setActiveDragItem(questions.find(q => q.id === active.id) || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.data.current?.fromSidebar) {
      const fieldType = active.data.current?.type;
      if (!fieldType) return;

      const tempId = `temp-${Date.now()}`;
      const newQuestion: Partial<QuestionData> = { id: tempId, question_type: fieldType, question_text: fieldMap[fieldType].label };


      setQuestions(prev => [...prev, newQuestion as QuestionData]);
      setEditingQuestion(newQuestion);
      setIsModalOpen(true);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(questions, oldIndex, newIndex);
      setQuestions(reordered);

      const updates = reordered.map((q, index) => ({ id: q.id!, order_number: index + 1 }));
      reorderMutation.mutate(updates);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/questionnaire/${questionnaireId}`;

    // Check for modern clipboard API support in a secure context
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Link copiado para a área de transferência!');
      }).catch(() => {
        toast.error('Não foi possível copiar o link.');
      });
    } else {
      // Fallback for insecure contexts or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;

      // Make the textarea non-editable and invisible
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          toast.success('Link copiado para a área de transferência!');
        } else {
          toast.error('Não foi possível copiar o link.');
        }
      } catch (err) {
        toast.error('Falha ao copiar. Por favor, copie o link manualmente.');
      }

      document.body.removeChild(textArea);
    }
  };

  // --- Render ---
  const isLoading = isLoadingQuestionnaire || isLoadingQuestions || templateMutation.isPending;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full bg-background">
        {!isPreviewMode && <FieldsSidebar onAddField={handleAddFieldClick} />}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/portal/cpa')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{questionnaire?.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCopyLink} variant="outline" size="icon"><CopyLink className="h-4 w-4" /></Button>
                <Button onClick={() => setIsPreviewMode(!isPreviewMode)} variant="outline">
                  {isPreviewMode ? "Voltar ao Editor" : "Visualizar"}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              {isPreviewMode ? "Esta é uma prévia de como o formulário aparecerá." : "Clique ou arraste um campo para adicionar, ou arraste um campo existente para reordenar."}
            </p>

            {isPreviewMode ? (
              <FormPreview questions={questions} />
            ) : (
              <SortableContext items={questions.map(q => q.id!)} strategy={verticalListSortingStrategy}>
                <div
                  ref={setNodeRef}
                  className={`space-y-3 min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${isOver ? 'bg-primary/10 border-primary' : 'bg-muted/20 hover:bg-muted/30'
                    }`}
                >
                  {questions.map((q) => (
                    <SortableQuestionItem
                      key={q.id}
                      question={q}
                      icon={fieldMap[q.question_type]?.icon}
                      isSelected={q.id === editingQuestion?.id}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                  {questions.length === 0 && <p className="text-center text-muted-foreground">Arraste campos aqui para começar</p>}
                </div>
              </SortableContext>
            )}
          </div>
        </div>
        <QuestionEditorModal
          isOpen={isModalOpen}
          onClose={handleCancelModal}
          onSave={handleSaveQuestion}
          question={editingQuestion}
          saving={saveQuestionMutation.isPending}
        />
        <DragOverlay>
          {activeDragItem ? (
            ('fromSidebar' in activeDragItem) ? (
              <FieldPreview item={activeDragItem} />
            ) : (
              <SortableQuestionItem
                question={activeDragItem as QuestionData}
                icon={fieldMap[(activeDragItem as QuestionData).question_type]?.icon}
                isSelected={true}
                onEdit={() => { }}
                onDelete={() => { }}
              />
            )
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default QuestionnaireBuilder;
