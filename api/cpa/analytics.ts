//==========================
// Título : CPA analytics — GET último registro ou POST recálculo (NPS, stats, word freq)
// Rotas: GET|POST /api/cpa/analytics?questionnaire_id=
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
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
}

// --- GET: último snapshot em cpa_analytics ---
async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
) {
  const questionnaireId = req.query.questionnaire_id as string | undefined;
  if (!questionnaireId) {
    return res.status(400).json({ error: 'questionnaire_id é obrigatório' });
  }

  // último processed_at
  const { data, error } = await supabase
    .from('cpa_analytics')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('processed_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[cpa/analytics] GET error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar analytics' });
  }

  // envelope { results: [...] }
  return res.status(200).json({ results: data ?? [] });
}

// --- POST: recalcula e faz upsert em cpa_analytics (processo na própria função) ---
async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
) {
  // questionnaire_id: query ou body
  const questionnaireId =
    (req.query.questionnaire_id as string | undefined) ||
    (req.body?.questionnaire_id as string | undefined);

  if (!questionnaireId) {
    return res.status(400).json({ error: 'questionnaire_id é obrigatório' });
  }

  // --- ids de respostas ---
  const { data: responseRows, error: respErr } = await supabase
    .from('cpa_questionnaire_responses')
    .select('id')
    .eq('questionnaire_id', questionnaireId);

  if (respErr) {
    console.error('[cpa/analytics] POST responses error:', respErr.message);
    return res.status(500).json({ error: 'Erro ao buscar respostas' });
  }

  const totalResponses = responseRows?.length ?? 0;

  if (totalResponses === 0) {
    return res.status(200).json({
      status: 'ok',
      message: 'Sem respostas para processar',
      total_responses_analyzed: 0,
    });
  }

  const responseIds = (responseRows as ResponseRow[]).map((r) => r.id);

  // --- answers ---
  const { data: answers, error: answersErr } = await supabase
    .from('cpa_response_answers')
    .select('question_id, answer_value')
    .in('response_id', responseIds);

  if (answersErr) {
    console.error('[cpa/analytics] POST answers error:', answersErr.message);
    return res.status(500).json({ error: 'Erro ao buscar answers' });
  }

  // --- questões NPS (0–10) ---
  const { data: npsQuestions } = await supabase
    .from('cpa_questions')
    .select('id')
    .eq('questionnaire_id', questionnaireId)
    .eq('question_type', 'nps');

  const npsQuestionIds = new Set(((npsQuestions as QuestionRow[]) ?? []).map((q) => q.id));

  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let npsCount = 0;

  const questionStats: Record<string, { count: number; sum: number; frequency: Record<string, number> }> = {};
  const textAnswers: string[] = [];

  for (const row of (answers as AnswerRow[]) ?? []) {
    const qId = row.question_id;
    const val = row.answer_value;

    // stats por questão
    if (!questionStats[qId]) {
      questionStats[qId] = { count: 0, sum: 0, frequency: {} };
    }
    questionStats[qId].count++;
    questionStats[qId].frequency[val] = (questionStats[qId].frequency[val] ?? 0) + 1;

    const num = Number(val);
    if (!Number.isNaN(num)) {
      questionStats[qId].sum += num;
    }

    // buckets NPS
    if (npsQuestionIds.has(qId)) {
      const score = Number(val);
      if (!Number.isNaN(score)) {
        npsCount++;
        if (score >= 9) promoters++;
        else if (score >= 7) passives++;
        else detractors++;
      }
    }

    // textos longos → word freq
    if (typeof val === 'string' && val.length > 10 && Number.isNaN(Number(val))) {
      textAnswers.push(val.toLowerCase());
    }
  }

  const npsScore =
    npsCount > 0
      ? parseFloat((((promoters - detractors) / npsCount) * 100).toFixed(1))
      : 0;

  // --- frequência de palavras (stopwords PT) ---
  const stopwords = new Set([
    'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para',
    'com', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as',
    'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à',
    'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos',
    'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até',
    'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo',
    'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles',
  ]);

  const wordFrequencies: Record<string, number> = {};
  for (const text of textAnswers) {
    const words = text.replace(/[^a-záàâãéèêíïóôõöúçü\s]/gi, '').split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && !stopwords.has(word)) {
        wordFrequencies[word] = (wordFrequencies[word] ?? 0) + 1;
      }
    }
  }

  // --- upsert cpa_analytics ---
  const analyticsPayload = {
    questionnaire_id: questionnaireId,
    nps_score: npsScore,
    promoters_count: promoters,
    passives_count: passives,
    detractors_count: detractors,
    total_responses_analyzed: totalResponses,
    word_frequencies: wordFrequencies,
    question_stats: questionStats,
    // sentimento: reservado para worker de IA
    sentiment_positive: null,
    sentiment_neutral: null,
    sentiment_negative: null,
    avg_sentiment_score: null,
    insights: [],
    processed_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertErr } = await supabase
    .from('cpa_analytics')
    .upsert(analyticsPayload, { onConflict: 'questionnaire_id' })
    .select()
    .single();

  if (upsertErr) {
    console.error('[cpa/analytics] upsert error:', upsertErr.message);
    return res.status(500).json({ error: 'Erro ao salvar analytics. Tente novamente.' });
  }

  return res.status(200).json({
    status: 'ok',
    message: 'Analytics recalculados com sucesso',
    total_responses_analyzed: totalResponses,
    nps_score: npsScore,
    data: upserted,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  // --- JWT ---
  const { user, error: authError } = await authenticate(req, supabase);
  if (!user) {
    return res.status(401).json({ error: authError });
  }

  // --- dono do questionário ---
  const questionnaireId =
    (req.query.questionnaire_id as string | undefined) ||
    (req.method === 'POST' ? req.body?.questionnaire_id : undefined);

  if (!questionnaireId) {
    return res.status(400).json({ error: 'questionnaire_id é obrigatório' });
  }

  const ownership = await verifyQuestionnaireOwnership(supabase, user.id, questionnaireId);
  if (!ownership.authorized) {
    return res.status(ownership.status ?? 403).json({ error: ownership.error });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, supabase);
  }

  return handlePost(req, res, supabase);
}
