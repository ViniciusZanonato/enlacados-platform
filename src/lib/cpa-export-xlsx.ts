import * as XLSX from '@/lib/xlsx.mjs';
import { supabase } from '@/api/supabase/client';

//==========================
// Título : Exportar respostas do questionário para planilha (.xlsx)
//==========================

export async function exportQuestionnaireResponsesXlsx(
  questionnaireId: string,
  questionnaireTitle: string,
): Promise<void> {
  const { data, error } = await (supabase as any).rpc('get_questionnaire_responses_for_export', {
    p_questionnaire_id: questionnaireId,
  });

  if (error) throw error;

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('EMPTY');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas');

  const safeTitle = questionnaireTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `respostas_${safeTitle}.xlsx`);
}
