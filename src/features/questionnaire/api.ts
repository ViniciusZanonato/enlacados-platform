import { supabase } from '@/api/supabase/client';
import { QuestionData, AnswerOption } from '@/components/QuestionEditorModal';
import { questionnaireTemplates } from '@/data/questionnaireTemplates';

export const getQuestionnaire = async (id: string) => {
    const { data, error } = await (supabase as any).from('cpa_questionnaires').select('id, title').eq('id', id).single();
    if (error) throw error;
    return data as { id: string; title: string };
};

export const getQuestions = async (questionnaireId: string) => {
    const { data, error } = await (supabase as any)
        .from('cpa_questions')
        .select('*, answer_options:cpa_answer_options(*)')
        .eq('questionnaire_id', questionnaireId)
        .order('order_number', { ascending: true });

    if (error) throw error;

    return data.map((q: any) => ({
        ...q,
        answer_options: q.answer_options || [],
    })) as QuestionData[];
};

export const deleteQuestion = async (questionId: string) => {
    const { error } = await (supabase as any).from('cpa_questions').delete().eq('id', questionId);
    if (error) throw error;
    return questionId;
};

export const reorderQuestions = async (updates: { id: string; order_number: number }[]) => {
    const { error } = await (supabase as any).rpc('update_question_order', { updates });
    if (error) throw error;
    return updates;
};

export const saveQuestionAndOptions = async (
    questionnaireId: string,
    questionData: Partial<QuestionData>,
    options: AnswerOption[]
) => {
    const { answer_options, ...questionOnlyData } = questionData;
    const isNewQuestion = !questionOnlyData.id;

    // 1. Save the question (Insert or Update)
    let savedQuestion: QuestionData;
    if (isNewQuestion) {
        const { id, ...insertData } = questionOnlyData;
        const { data, error } = await (supabase as any).from('cpa_questions').insert({ ...insertData, questionnaire_id: questionnaireId }).select().single();
        if (error) throw error;
        savedQuestion = data;
    } else {
        const { data, error } = await (supabase as any).from('cpa_questions').update(questionOnlyData).eq('id', questionOnlyData.id!).select().single();
        if (error) throw error;
        savedQuestion = data;
    }
    if (!savedQuestion) throw new Error("Question data not returned after save.");

    // 2. Save the options
    const isOptionsBased = ['radio', 'checkbox', 'select'].includes(savedQuestion.question_type);
    let savedOptions: AnswerOption[] = [];
    if (isOptionsBased) {
        await (supabase as any).from('cpa_answer_options').delete().eq('question_id', savedQuestion.id);
        if (options.length > 0) {
            const newOptions = options.map((opt, index) => ({
                question_id: savedQuestion.id,
                option_text: opt.option_text,
                order_number: index + 1,
            }));
            const { data: newOptionsData, error: optionsError } = await (supabase as any).from('cpa_answer_options').insert(newOptions).select();
            if (optionsError) throw optionsError;
            savedOptions = newOptionsData || [];
        }
    }

    return { ...savedQuestion, answer_options: savedOptions };
};

export const insertTemplate = async (templateId: string, questionnaireId: string) => {
    const template = questionnaireTemplates.find(t => t.id === templateId);
    if (!template) throw new Error("Template not found");

    const questionsToInsert = template.questions.map((q, index) => ({
        questionnaire_id: questionnaireId,
        question_type: q.question_type,
        question_text: q.question_text,
        description: q.description || '',
        placeholder: q.placeholder || '',
        help_text: q.help_text || '',
        is_required: q.is_required ?? false,
        order_number: index + 1,
    }));

    const { data: insertedQuestions, error: questionsError } = await (supabase as any)
        .from('cpa_questions')
        .insert(questionsToInsert)
        .select('*');

    if (questionsError) throw questionsError;

    const allInsertedOptions: { [questionId: string]: AnswerOption[] } = {};

    for (const insertedQ of insertedQuestions) {
        const qAny = insertedQ as any;
        const originalTemplateQ = template.questions.find(tq => tq.question_text === qAny.question_text && tq.question_type === qAny.question_type);
        if (originalTemplateQ?.answer_options && originalTemplateQ.answer_options.length > 0) {
            const optionsToInsert = originalTemplateQ.answer_options.map((opt, index) => ({
                question_id: qAny.id,
                option_text: opt.option_text,
                order_number: index + 1,
            }));
            const { data: newOptions, error: optionsError } = await (supabase as any).from('cpa_answer_options').insert(optionsToInsert).select('*');
            if (optionsError) throw optionsError;
            if (newOptions) {
                allInsertedOptions[qAny.id] = newOptions;
            }
        }
    }

    return (insertedQuestions as any[]).map(q => ({
        ...q,
        answer_options: allInsertedOptions[q.id] || [],
    })) as unknown as QuestionData[];
};
