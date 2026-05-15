//==========================
// Título : CPA resultados — breakdown por questão + média geral (GET, JWT + dono)
// GET /api/cpa/results?questionnaire_id=
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate, verifyQuestionnaireOwnership, createServiceClient } from './_auth.js';

interface ResponseRow {
  id: string;
}

interface AnswerRow {
  question_id: string;
  answer_value: string;
}

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  // --- JWT ---
  const { user, error: authError } = await authenticate(req, supabase);
  if (!user) {
    return res.status(401).json({ error: authError });
  }

  // --- questionnaire_id ---
  const questionnaireId = req.query.questionnaire_id as string | undefined;
  if (!questionnaireId) {
    return res.status(400).json({ error: 'questionnaire_id é obrigatório' });
  }

  // --- permissão: instituição dona ---
  const ownership = await verifyQuestionnaireOwnership(supabase, user.id, questionnaireId);
  if (!ownership.authorized) {
    return res.status(ownership.status ?? 403).json({ error: ownership.error });
  }

  // --- perguntas ---
  const { data: questions, error: questionsErr } = await supabase
    .from('cpa_questions')
    .select('id, question_text, question_type')
    .eq('questionnaire_id', questionnaireId)
    .order('order_number', { ascending: true });

  if (questionsErr) {
    console.error('[cpa/results] questions fetch error:', questionsErr.message);
    return res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }

  // --- respostas (sessões) ---
  const { data: responseRows, error: respErr } = await supabase
    .from('cpa_questionnaire_responses')
    .select('id')
    .eq('questionnaire_id', questionnaireId);

  if (respErr) {
    console.error('[cpa/results] responses fetch error:', respErr.message);
    return res.status(500).json({ error: 'Erro ao buscar respostas' });
  }

  const totalResponses = responseRows?.length ?? 0;

  if (totalResponses === 0) {
    return res.status(200).json({
      questionnaire_id: questionnaireId,
      questionnaire_title: ownership.questionnaireTitle,
      total_responses: 0,
      breakdown: [],
      overall_avg: null,
    });
  }

  const responseIds = (responseRows as ResponseRow[]).map((r) => r.id);

  // --- valores por answer ---
  const { data: answers, error: answersErr } = await supabase
    .from('cpa_response_answers')
    .select('question_id, answer_value')
    .in('response_id', responseIds);

  if (answersErr) {
    console.error('[cpa/results] answers fetch error:', answersErr.message);
    return res.status(500).json({ error: 'Erro ao buscar valores das respostas' });
  }

  // --- agregar por questão ---
  const answersByQuestion: Record<string, string[]> = {};
  for (const row of (answers as AnswerRow[]) ?? []) {
    if (!answersByQuestion[row.question_id]) {
      answersByQuestion[row.question_id] = [];
    }
    answersByQuestion[row.question_id].push(row.answer_value);
  }

  const numericTypes = new Set(['radio', 'nps', 'number', 'select']);
  const ratingNumericTypes = new Set(['nps', 'number']);

  const breakdown = ((questions as QuestionRow[]) ?? []).map((q) => {
    const rawAnswers = answersByQuestion[q.id] ?? [];
    const answerCount = rawAnswers.length;

    // tabela de frequência
    const frequency: Record<string, number> = {};
    for (const val of rawAnswers) {
      frequency[val] = (frequency[val] ?? 0) + 1;
    }

    // média numérica quando aplicável
    let avg: number | null = null;
    if (numericTypes.has(q.question_type) && answerCount > 0) {
      const nums = rawAnswers.map(Number).filter(n => !Number.isNaN(n));
      if (nums.length > 0) {
        avg = parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
      }
    }

    return {
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      answer_count: answerCount,
      frequency,
      avg,
    };
  });

  // --- média global (só tipos nota/NPS) ---
  const ratingBreakdown = breakdown.filter(
    b => ratingNumericTypes.has(b.question_type) && b.avg !== null
  );
  let overallAvg: number | null = null;
  if (ratingBreakdown.length > 0) {
    const sum = ratingBreakdown.reduce((acc, b) => acc + (b.avg as number), 0);
    overallAvg = parseFloat((sum / ratingBreakdown.length).toFixed(2));
  }

  return res.status(200).json({
    questionnaire_id: questionnaireId,
    questionnaire_title: ownership.questionnaireTitle,
    total_responses: totalResponses,
    breakdown,
    overall_avg: overallAvg,
  });
}
