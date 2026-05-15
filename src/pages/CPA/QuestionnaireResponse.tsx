import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QuestionData } from '@/components/QuestionEditorModal'; // Pegando emprestado a interface, pra não repetir código

interface QuestionnaireDetails {
  id: string;
  title: string;
  description: string | null;
}

const QuestionnaireResponse = () => {
  const { user, loading: authLoading } = useAuth();
  const { id: questionnaireId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const loadData = async () => {
      if (!questionnaireId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Puxando os detalhes do questionário
        const { data: qData, error: qError } = await supabase
          .from('cpa_questionnaires')
          .select('id, title, description')
          .eq('id', questionnaireId)
          .maybeSingle();

        if (qError) throw qError;
        if (!qData) {
          toast.error('Questionário não encontrado ou inativo.');
          setQuestionnaire(null);
          return;
        }
        if (isMounted) setQuestionnaire(qData);

        // Agora, puxando as perguntas com as opções de resposta
        const { data: questionsData, error: questionsError } = await supabase
          .from('cpa_questions')
          .select('*, answer_options:cpa_answer_options(*)')
          .eq('questionnaire_id', questionnaireId)
          .order('order_number', { ascending: true });
        if (questionsError) throw questionsError;
        
        const questionsWithInitializedOptions = questionsData.map(q => ({
            ...q,
            answer_options: q.answer_options || [],
        }));
        if (isMounted) setQuestions(questionsWithInitializedOptions);

      } catch (error: Error) {
        console.error('Error fetching questionnaire:', error.message);
        toast.error('Erro ao carregar questionário.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [questionnaireId]);

  useEffect(() => {
    if (!authLoading && !user) {
      localStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/auth');
      toast.info('Você precisa estar logado para responder a este questionário.');
    }
  }, [user, authLoading, navigate, location.pathname]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para enviar uma resposta.');
      localStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/auth');
      return;
    }

    if (Object.keys(answers).length === 0) {
        toast.warning('Por favor, responda pelo menos uma pergunta antes de enviar.');
        return;
    }

    setSubmitting(true);
    try {
        const { data, error } = await supabase.rpc('submit_questionnaire_response', {
            p_questionnaire_id: questionnaireId,
            p_answers: answers,
            p_started_at: startTime?.toISOString(),
        });

        if (error) throw error;

        if (data.success) {
            toast.success('Respostas enviadas com sucesso! Obrigado por participar.');
            navigate('/thank-you');
        } else {
            throw new Error('A resposta do servidor indicou uma falha.');
        }

    } catch (error: Error) {
        console.error('Error submitting answers:', error.message);
        toast.error(`Erro ao enviar respostas: ${error.message}`);
    } finally {
        // Não muda o submitting pra false aqui se for pra redirecionar o cara
        // setSubmitting(false);
    }
  };

  const renderQuestion = (question: QuestionData) => {
    const { id, question_type, question_text, description, is_required, image_url } = question;
    if (!id) return null;

    switch (question_type) {
        case 'header_image':
            return image_url ? <img src={image_url} alt={question_text} className="w-full max-w-md mx-auto my-4 rounded-lg" /> : null;
        case 'separator':
            return <hr className="my-6" />;
        case 'text':
        case 'email':
        case 'url':
        case 'number':
            return (
                <div className="space-y-2">
                    <Label htmlFor={id}>{question_text}{is_required && <span className="text-red-500">*</span>}</Label>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <Input id={id} type={question_type} required={is_required} onChange={e => handleAnswerChange(id, e.target.value)} />
                </div>
            );
        case 'textarea':
            return (
                <div className="space-y-2">
                    <Label htmlFor={id}>{question_text}{is_required && <span className="text-red-500">*</span>}</Label>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <Textarea id={id} required={is_required} onChange={e => handleAnswerChange(id, e.target.value)} />
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    <Label>{question_text}{is_required && <span className="text-red-500">*</span>}</Label>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <RadioGroup onValueChange={value => handleAnswerChange(id, value)}>
                        {question.answer_options?.map(opt => (
                            <div key={opt.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.option_text} id={opt.id} />
                                <Label htmlFor={opt.id}>{opt.option_text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        case 'checkbox':
             return (
                <div className="space-y-2">
                    <Label>{question_text}{is_required && <span className="text-red-500">*</span>}</Label>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    {question.answer_options?.map(opt => (
                        <div key={opt.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={opt.id} 
                                onCheckedChange={checked => {
                                    const currentAnswers = answers[id] || [];
                                    const newAnswers = checked 
                                        ? [...currentAnswers, opt.option_text]
                                        : currentAnswers.filter((a: string) => a !== opt.option_text);
                                    handleAnswerChange(id, newAnswers);
                                }}
                            />
                            <Label htmlFor={opt.id}>{opt.option_text}</Label>
                        </div>
                    ))}
                </div>
            );
        default:
            return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!questionnaire) {
    return <div className="flex justify-center items-center h-screen"><p>Questionário não encontrado.</p></div>;
  }

  return (
    <div className="bg-muted min-h-screen py-12">
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-3xl">{questionnaire.title}</CardTitle>
                {questionnaire.description && <CardDescription>{questionnaire.description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
                    {questions.map(q => (
                        <div key={q.id}>
                            {renderQuestion(q)}
                        </div>
                    ))}
                    <Button type="submit" disabled={submitting}>
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar Respostas'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
};

export default QuestionnaireResponse;
