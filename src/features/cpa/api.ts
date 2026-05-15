import { supabase } from '@/api/supabase/client';
import { apiFetch } from '@/lib/api-client';
import { ChartConfig, Template, LatestResponse, Question } from './types';

//==========================
// Título : API do módulo CPA — RPCs no Supabase e rotas Vercel /api/cpa
//==========================

export const getResponseCount = async (questionnaireId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('get_response_count_for_questionnaire', {
    p_questionnaire_id: questionnaireId,
  });
  if (error) throw new Error(error.message);
  return data as number;
};

export const getNpsScore = async (questionnaireId: string): Promise<{ nps_score: number; total_responses: number; nps_question_text: string } | null> => {
  const { data, error } = await supabase.rpc('get_nps_for_questionnaire', {
    p_questionnaire_id: questionnaireId,
  }).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // sem linha: ok
    throw new Error(error.message);
  }
  return data as any;
};

export const getLatestResponses = async (questionnaireId: string, limit: number = 3): Promise<LatestResponse[]> => {
  const { data, error } = await supabase.rpc('get_latest_responses', {
    p_questionnaire_id: questionnaireId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return data as unknown as LatestResponse[];
};

export const getAvgCompletionTime = async (questionnaireId: string) => {
  const { data, error } = await supabase
    .rpc('get_avg_completion_time', { p_questionnaire_id: questionnaireId })
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getHighestLowestRatedQuestions = async (questionnaireId: string): Promise<any[]> => {
  const { data, error } = await supabase.rpc('get_highest_lowest_rated_questions', {
    p_questionnaire_id: questionnaireId,
  });
  if (error) throw new Error(error.message);
  return data as any[];
};

export const getQuestionsForBuilder = async (questionnaireId: string): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('cpa_questions' as any)
    .select('id, question_text, question_type')
    .eq('questionnaire_id', questionnaireId);
  if (error) throw error;
  return (data as any) || [];
};

export const getDashboardCharts = async (questionnaireId: string): Promise<ChartConfig[]> => {
  const { data, error } = await supabase
    .from('cpa_dashboard_charts' as any)
    .select('id, config')
    .eq('questionnaire_id', questionnaireId);

  if (error) throw error;
  return (data as any).map((chart: any) => ({ ...chart.config, id: chart.id })) as ChartConfig[];
};

export const getDashboardTemplates = async (): Promise<Template[]> => {
  const { data, error } = await supabase
    .from('cpa_dashboard_templates' as any)
    .select('id, name, charts');

  if (error) throw error;
  return (data as any) as Template[];
};

export const upsertDashboardChart = async (chartConfig: ChartConfig, questionnaireId: string) => {
  const { data, error } = await supabase.rpc('upsert_dashboard_chart', {
    p_chart_id: chartConfig.id,
    p_questionnaire_id: questionnaireId,
    p_config: chartConfig as unknown as any,
  });
  if (error) throw error;
  return data;
};

export const deleteDashboardChart = async (chartId: string) => {
  const { data, error } = await supabase.rpc('delete_dashboard_chart', { p_chart_id: chartId });
  if (error) throw error;
  return data;
};

export const saveDashboardTemplate = async (name: string, charts: ChartConfig[]) => {
  const { data, error } = await supabase.rpc('save_dashboard_template', { p_name: name, p_charts: charts as unknown as any });
  if (error) throw error;
  return data;
};

export const deleteDashboardTemplate = async (templateId: string) => {
  const { data, error } = await supabase.rpc('delete_dashboard_template', { p_template_id: templateId });
  if (error) throw error;
  return data;
};

export const getQuestionnaireTitle = async (questionnaireId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('cpa_questionnaires' as any)
    .select('title')
    .eq('id', questionnaireId)
    .single();
  if (error) throw error;
  return (data as any).title;
};

// --- Analytics agregados (Vercel) ---
export interface CPAAnalyticsData {
  id: string;
  nps_score: number;
  promoters_count: number;
  passives_count: number;
  detractors_count: number;
  sentiment_positive: number | null;
  sentiment_neutral: number | null;
  sentiment_negative: number | null;
  avg_sentiment_score: number | null;
  word_frequencies: Record<string, number>;
  question_stats: Record<string, any>;
  total_responses_analyzed: number;
  processed_at: string;
  insights: any[];
}

/**
 * [S5-002] Lara: Atualiza para usar a RPC cpa_refresh_all_stale
 */
export const refreshAllStaleMetrics = async () => {
  const { data, error } = await supabase.rpc('cpa_refresh_all_stale');
  if (error) throw error;
  return data;
};

// GET /api/cpa/analytics?questionnaire_id=
// [S5-002] Lara: Agora busca da tabela cpa_metrics_cache no Supabase
export const getCPAAnalytics = async (questionnaireId: string): Promise<CPAAnalyticsData | null> => {
  try {
    const { data: rows, error } = await supabase
      .from('cpa_metrics_cache' as any)
      .select('*')
      .eq('questionnaire_id', questionnaireId);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      // Fallback para a rota legada se o cache estiver vazio (opcional, mas seguro)
      const response = await apiFetch<{ results: CPAAnalyticsData[] }>(
        `/cpa/analytics?questionnaire_id=${questionnaireId}`,
      );
      return response.results?.[0] || null;
    }

    // Mapeamento de linhas (EAV-ish) para o objeto consolidado CPAAnalyticsData
    const analytics: CPAAnalyticsData = {
      id: questionnaireId,
      nps_score: 0,
      promoters_count: 0,
      passives_count: 0,
      detractors_count: 0,
      sentiment_positive: null,
      sentiment_neutral: null,
      sentiment_negative: null,
      avg_sentiment_score: null,
      word_frequencies: {},
      question_stats: {},
      total_responses_analyzed: 0,
      processed_at: new Date().toISOString(),
      insights: []
    };

    rows.forEach((row: any) => {
      const type = row.metric_type;
      const val = row.metric_value;
      const json = row.metric_json;

      if (type === 'nps_score') analytics.nps_score = val;
      else if (type === 'promoters_count') analytics.promoters_count = val;
      else if (type === 'passives_count') analytics.passives_count = val;
      else if (type === 'detractors_count') analytics.detractors_count = val;
      else if (type === 'sentiment_positive') analytics.sentiment_positive = val;
      else if (type === 'sentiment_neutral') analytics.sentiment_neutral = val;
      else if (type === 'sentiment_negative') analytics.sentiment_negative = val;
      else if (type === 'avg_sentiment_score') analytics.avg_sentiment_score = val;
      else if (type === 'word_frequencies') analytics.word_frequencies = json || {};
      else if (type === 'question_stats') analytics.question_stats = json || {};
      else if (type === 'insights') analytics.insights = json || [];
      else if (type === 'total_responses') analytics.total_responses_analyzed = val;
      
      // Usa a data mais recente como processed_at
      if (row.calculated_at && row.calculated_at > analytics.processed_at) {
        analytics.processed_at = row.calculated_at;
      }
    });

    return analytics;
  } catch (error) {
    console.error('[cpa/api] getCPAAnalytics error:', error);
    return null;
  }
};

// POST /api/cpa/analytics?questionnaire_id=
export const requestAnalyticsRefresh = async (questionnaireId: string) => {
  return apiFetch(`/cpa/analytics?questionnaire_id=${questionnaireId}`, { method: 'POST' });
};

// Insights (hoje vêm em getCPAAnalytics.insights; rota reservada)
export const getCPAInsights = async (analyticsId: string) => {
  return apiFetch(`/cpa/analytics?analytics_id=${analyticsId}`);
};

// Stub sentimento (futuro worker de IA)
export const analyzeSentimentPy = async (texts: string[]): Promise<{ text: string, sentiment: string }[]> => {
  return texts.map(text => ({ text, sentiment: 'NEUTRO' }));
};

// Stub nuvem — preferir word_frequencies do analytics
export const getWordCloudPy = async (_texts: string[]): Promise<Record<string, number>> => {
  return {};
};
